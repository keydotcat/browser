import browser from 'webextension-polyfill';
import AutofillMgr from '@/background/autofill';
import { BrowserApi } from '@/helper/browser-api';

export default class BrowserEventMgr {
  constructor(store, iconMgr) {
    this.store = store;
    this.autofill = new AutofillMgr();
    this.icon = iconMgr;
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

  async onTabMessage(request, sender, sendResponse) {
    switch (request.command) {
      case 'bgCollectPageDetails':
        BrowserApi.tabSendMessage(sender.tab, { command: 'collectPageDetails', tab: sender.tab, sender: request.sender });
        break;
      case 'collectPageDetailsResponse':
        const forms = this.autofill.getFormsWithPasswordFields(request.details);
        await BrowserApi.tabSendMessageData(request.tab, 'notificationBarPageDetails', {
          details: request.details,
          forms: forms,
        });
        break;
    }
  }

  async sendPopupData() {
    var ctab = await BrowserApi.getTabFromCurrentWindow();
    console.log('ctab', ctab);
    var ret = {
      loggedIn: false,
      url: ctab.url,
    };
    if (!this.store.getters['session/loggedIn']) {
      return ret;
    }
    ret.loggedIn = true;
    ret.secrets = this.store.getters['secrets/forUrl'](ctab.url).map(sec => {
      return sec.cloneAsObject();
    });
    console.log('Sending', ret);
    return ret;
  }

  searchSecrets(name) {
    return this.store.getters['secrets/filteredSecrets']('location', { search: name }).map(sec => {
      return sec.cloneAsObject();
    });
  }

  onRuntimeMessage(request, sender, sendResponse) {
    console.log('Got msg', request, sender);
    if (sender.tab) {
      //process from tabs
      this.onTabMessage(request, sender, sendResponse);
    } else {
      //process from popup (or any other bg-context)
      switch (request.cmd) {
        case 'login':
          return this.store.dispatch('session/login', request);
        case 'logout':
          return new Promise(resolve => {
            this.store.dispatch('session/logout');
            resolve({ ok: true });
          });
        case 'popupOpen':
          return this.sendPopupData();
        case 'popupSearch':
          return new Promise(resolve => {
            resolve(this.searchSecrets(request.name));
          });
      }
    }
  }
}
