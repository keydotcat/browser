import browser from 'webextension-polyfill'
import AutofillMgr from '@/background/autofill'
import { BrowserApi } from '@/helper/browser-api'
import UrlParse from '@/commonjs/helpers/urlparse'
import NotificationQueue from '@/background/notification-queue'
import SecretData from '@/commonjs/secrets/secret_data'

export default class BrowserEventMgr {
  constructor(store, iconMgr) {
    this.store = store
    this.autofill = new AutofillMgr()
    this.icon = iconMgr
    this.tabs = {}
    this.nots = new NotificationQueue()
  }

  subscribe() {
    browser.tabs.onCreated.addListener(t => {
      return this.tabInit(t)
    })
    browser.tabs.onActivated.addListener(t => {
      return this.tabInit(t)
    })
    browser.tabs.onReplaced.addListener(t => {
      return this.tabInit(t)
    })
    browser.tabs.onUpdated.addListener(t => {
      return this.tabInit(t)
    })
    browser.runtime.onMessage.addListener((r, s, c) => {
      return this.onRuntimeMessage(r, s, c)
    })
  }

  tabInit(tabInfo) {
    window.setTimeout(() => {
      this.nots.check()
      this.tabUpdateIcon(tabInfo)
    }, 1000)
  }

  async tabUpdateIcon(tabInfo) {
    const ctab = await BrowserApi.getTabFromCurrentWindow()
    if (ctab == null || ctab.url == null) {
      return
    }
    var secrets = this.store.getters['secrets/forUrl'](ctab.url)
    var nc = 0
    secrets.forEach(secret => {
      nc += secret.data.creds.length
    })
    this.icon.setNumberOfEntries(ctab.id, nc)
  }

  async onTabMessage(msg, sender, sendResponse) {
    switch (msg.cmd) {
      case 'bgCollectPageDetails':
        BrowserApi.tabSendMessage(sender.tab, { cmd: 'collectPageDetails', tab: sender.tab, sender: msg.sender })
        break
      case 'collectPageDetailsResponse':
        const forms = this.autofill.getFormsWithPasswordFields(msg.details)
        await BrowserApi.tabSendMessageData(msg.tab, 'notificationBarPageDetails', {
          details: msg.details,
          forms: forms
        })
        break
      case 'bgGetVaults':
        await BrowserApi.tabSendMessageData(sender.tab, 'bgGetVaultsResponse', this.store.getters['user/allVaults'])
        break
      case 'bgNotificationClose':
        this.nots.removeTab(sender.tab)
        BrowserApi.tabSendMessageData(sender.tab, 'closeNotificationBar')
        break
      case 'bgAddLogin':
        this.addLogin(sender.tab, msg.login)
        break
      case 'bgAddLoginYes':
        this.addLoginYes(sender.tab, msg.data)
        break
      case 'bgChangePasswordYes':
        this.changePassword(sender.tab)
        break
      case 'bgChangePasswordIgnore':
        this.ignorePasswordChange(sender.tab)
        break
    }
  }

  changePassword(tab) {
    this.nots.runWith(tab, 'changePassword', notif => {
      notif.secrets.forEach(secret => {
        var i = 0
        for (i = 0; i < secret.data.creds.length; i++) {
          if (secret.data.creds[i].username === notif.username) {
            secret.data.creds[i].password = notif.password
          }
        }
        this.store.dispatch('secrets/update', {
          teamId: secret.teamId,
          vaultId: secret.vaultId,
          secretId: secret.secretId,
          secretData: new SecretData(secret.data)
        })
      })
    })
    BrowserApi.tabSendMessageData(tab, 'closeNotificationBar')
  }

  ignorePasswordChange(tab) {
    //TODO
    this.nots.removeTab(sender.tab)
    BrowserApi.tabSendMessageData(tab, 'closeNotificationBar')
  }

  addLoginYes(tab, vault) {
    this.nots.runWith(tab, 'addLogin', notif => {
      var secret = new SecretData({
        name: tab.title,
        type: 'location',
        urls: [notif.uri],
        creds: [
          {
            type: 'password',
            name: 'login',
            username: notif.username,
            password: notif.password
          }
        ]
      })
      this.store.dispatch('secrets/create', { teamId: vault.tid, vaultId: vault.vid, secretData: secret })
    })
    this.nots.check(tab)
    BrowserApi.tabSendMessageData(tab, 'closeNotificationBar')
  }

  addLogin(tab, login) {
    var tabDomain = UrlParse.getDomain(login.url)
    if (!tabDomain || tabDomain.length == 0) {
      return
    }
    var secrets = this.store.getters['secrets/forUrl'](tabDomain)
    var usermatch = secrets
      .map(secret => {
        var ns = secret.cloneAsObject()
        ns.data.creds = ns.data.creds.filter(cred => {
          return cred.username == login.username
        })
        return ns
      })
      .filter(secret => {
        return secret.data.creds.length > 0
      })
    console.log('USERMAPTV', usermatch, secrets)
    this.nots.removeTab(tab)
    if (usermatch.length > 0) {
      var passmatch = usermatch
        .map(secret => {
          secret.data.creds = secret.data.creds.filter(cred => {
            return cred.password == login.password
          })
          return secret
        })
        .filter(secret => {
          return secret.data.creds.length > 0
        })
      if (passmatch.length > 0) {
        //If a credential + pass matches do not request a change
        return
      }
      var passdif = usermatch
        .map(secret => {
          secret.data.creds = secret.data.creds.filter(cred => {
            return cred.password != login.password
          })
          return secret
        })
        .filter(secret => {
          return secret.data.creds.length > 0
        })
      if (passdif.length > 0) {
        this.nots.add({
          type: 'changePassword',
          secrets: passdif,
          username: login.username,
          password: login.password,
          domain: tabDomain,
          tabId: tab.id,
          expires: new Date(new Date().getTime() + 30 * 60000) // 30 minutes
        })
      }
    } else {
      this.nots.add({
        type: 'addLogin',
        username: login.username,
        password: login.password,
        domain: tabDomain,
        uri: login.url,
        tabId: tab.id,
        expires: new Date(new Date().getTime() + 30 * 60000) // 30 minutes
      })
    }
    this.nots.check(tab)
  }

  async sendPopupData() {
    var ctab = await BrowserApi.getTabFromCurrentWindow()
    var ret = {
      loggedIn: false,
      tab: ctab
    }
    if (!this.store.getters['session/loggedIn']) {
      return ret
    }
    ret.loggedIn = true
    ret.secrets = this.store.getters['secrets/forUrl'](ctab.url).map(sec => {
      return sec.cloneAsObject()
    })
    return ret
  }

  searchSecrets(name) {
    return this.store.getters['secrets/filteredSecrets']('location', { search: name }).map(sec => {
      return sec.cloneAsObject()
    })
  }

  async runtimeRespond(msg, sender, ftor) {
    var resp = await Promise.resolve(ftor())
    browser.runtime.sendMessage({ cmd: msg.cmd + 'Response', response: resp })
  }

  onRuntimeMessage(msg, sender, sendResponse) {
    console.log('Got mesg', msg)
    if (sender.tab) {
      //process from tabs
      this.onTabMessage(msg, sender, sendResponse)
    } else {
      //process from popup (or any other bg-context)
      switch (msg.cmd) {
        case 'login':
          this.runtimeRespond(msg, sender, () => {
            return this.store.dispatch('session/login', msg)
          })
          break
        case 'logout':
          this.runtimeRespond(msg, sender, () => {
            this.store.dispatch('session/logout')
            return { ok: true }
          })
          break
        case 'refreshContent':
          this.runtimeRespond(msg, sender, () => {
            this.store.dispatch('secrets/reload')
            return { ok: true }
          })
        case 'popupOpen':
          this.runtimeRespond(msg, sender, () => {
            return this.sendPopupData()
          })
          break
        case 'popupSearch':
          this.runtimeRespond(msg, sender, () => {
            return this.searchSecrets(msg.name)
          })
          break
      }
    }
  }
}
