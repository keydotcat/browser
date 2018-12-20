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
      return this.onTabActive(t);
    });
    browser.tabs.onReplaced.addListener(t => {
      return this.onTabReplaced(t);
    });
    browser.tabs.onUpdated.addListener(t => {
      return this.onTabUpdated(t);
    });
    browser.runtime.onMessage.addListener((r, s, c) => {
      return this.onRuntimeMessage(r, s, c);
    });
  }

  async onTabActive(tabInfo) {
    const ctab = await BrowserApi.getTabFromCurrentWindow();
    var secrets = this.store.getters['secrets/forUrl'](ctab.url);
    var nc = 0;
    secrets.forEach(secret => {
      nc += secret.data.creds.length;
    });
    this.icon.setNumberOfEntries(ctab.id, nc);
  }

  onTabReplaced(tabInfo) {
    console.log('tab repla', tabInfo);
  }

  onTabUpdated(tabInfo) {
    console.log('tab updated', tabInfo);
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

  onRuntimeMessage(msg, sender, sendResponse) {
    console.log('Got msg', msg, sender);
    if (sender.tab) {
      //process from tabs
      this.onTabMessage(msg, sender, sendResponse);
    } else {
      //process from popup (or any other bg-context)
      switch (msg.cmd) {
        case 'login':
          return this.store.dispatch('session/login', msg);
        case 'logout':
          return new Promise(resolve => {
            this.store.dispatch('session/logout');
            resolve({ ok: true });
          });
        case 'popupOpen':
          return this.sendPopupData();
        case 'popupSearch':
          return new Promise(resolve => {
            resolve(this.searchSecrets(msg.name));
          });
      }
    }
  }
}
