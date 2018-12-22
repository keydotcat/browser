import browser from 'webextension-polyfill';
import AutofillMgr from '@/background/autofill';
import { BrowserApi } from '@/helper/browser-api';
import Tab from '@/background/tab';

export default class BrowserEventMgr {
  constructor(store, iconMgr) {
    this.store = store;
    this.autofill = new AutofillMgr();
    this.icon = iconMgr;
    this.tabs = {};
  }

  subscribe() {
    browser.tabs.onActivated.addListener(t => {
      return this.tabUpdateIcon(t);
    });
    browser.tabs.onReplaced.addListener(t => {
      return this.tabUpdateIcon(t);
    });
    browser.tabs.onUpdated.addListener(t => {
      return this.tabUpdateIcon(t);
    });
    browser.runtime.onMessage.addListener((r, s, c) => {
      return this.onRuntimeMessage(r, s, c);
    });
  }

  async tabUpdateIcon(tabInfo) {
    const ctab = await BrowserApi.getTabFromCurrentWindow();
    var secrets = this.store.getters['secrets/forUrl'](ctab.url);
    var nc = 0;
    secrets.forEach(secret => {
      nc += secret.data.creds.length;
    });
    this.icon.setNumberOfEntries(ctab.id, nc);
  }

  async onTabMessage(msg, sender, sendResponse) {
    switch (msg.command) {
      case 'bgCollectPageDetails':
        BrowserApi.tabSendMessage(sender.tab, { command: 'collectPageDetails', tab: sender.tab, sender: msg.sender });
        break;
      case 'collectPageDetailsResponse':
        const forms = this.autofill.getFormsWithPasswordFields(msg.details);
        await BrowserApi.tabSendMessageData(msg.tab, 'notificationBarPageDetails', {
          details: msg.details,
          forms: forms,
        });
        break;
    }
  }

  async sendPopupData() {
    var ctab = await BrowserApi.getTabFromCurrentWindow();
    var ret = {
      loggedIn: false,
      tab: ctab,
    };
    if (!this.store.getters['session/loggedIn']) {
      return ret;
    }
    ret.loggedIn = true;
    ret.secrets = this.store.getters['secrets/forUrl'](ctab.url).map(sec => {
      return sec.cloneAsObject();
    });
    return ret;
  }

  searchSecrets(name) {
    return this.store.getters['secrets/filteredSecrets']('location', { search: name }).map(sec => {
      return sec.cloneAsObject();
    });
  }

  async runtimeRespond(msg, sender, ftor) {
    var resp = await Promise.resolve(ftor());
    browser.runtime.sendMessage({ cmd: msg.cmd + 'Response', response: resp });
  }

  onRuntimeMessage(msg, sender, sendResponse) {
    console.log('Got msg', msg, sender);
    if (sender.tab) {
      //process from tabs
      this.onTabMessage(msg, sender, sendResponse);
    } else {
      //process from popup (or any other bg-context)
      switch (msg.cmd) {
        case 'login':
          this.runtimeRespond(msg, sender, () => {
            return this.store.dispatch('session/login', msg);
          });
          break;
        case 'logout':
          this.runtimeRespond(msg, sender, () => {
            this.store.dispatch('session/logout');
            return { ok: true };
          });
          break;
        case 'popupOpen':
          this.runtimeRespond(msg, sender, () => {
            return this.sendPopupData();
          });
          break;
        case 'popupSearch':
          this.runtimeRespond(msg, sender, () => {
            return this.searchSecrets(msg.name);
          });
          break;
      }
    }
  }
}
