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
        this.nots.check(sender.tab)
      case 'bgAddLogin':
        this.addLogin(sender.tab, msg.login)
        break
      case 'bgAddLoginYes':
        this.addLoginYes(sender.tab, msg.data)
    }
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
  }

  addLogin(tab, login) {
    var tabDomain = UrlParse.getDomain(login.url)
    if (!tabDomain || tabDomain.length == 0) {
      return
    }
    var secrets = this.store.getters['secrets/forUrl'](tabDomain)
    var usermatch = secrets.filter(secret => {
      return secret.data.creds.filter(cred => {
        return cred.username == login.username
      })
    })
    this.nots.removeTab(tab)
    if (usermatch.length > 0) {
      this.nots.add({
        type: 'changePassword',
        secrets: usermatch,
        username: login.username,
        password: login.password,
        domain: tabDomain,
        tabId: tab.id,
        expires: new Date(new Date().getTime() + 30 * 60000) // 30 minutes
      })
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
