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
    browser.tabs.onActivated.addListener(() => {
      this.onTabActive();
    });
    browser.tabs.onReplaced.addListener(() => {
      this.onTabReplaced();
    });
    browser.tabs.onUpdated.addListener(() => {
      this.onTabUpdated();
    });
    browser.runtime.onMessage.addListener(() => {
      this.onRuntimeMessage();
    });
  }

  async onTabActive(tabInfo) {
    const ctab = await BrowserApi.getTabFromCurrentWindow();
    var creds = this.store.getters['secrets/credentialsForUrl'](ctab.url);
    this.icon.setNumberOfEntries(ctab.id, creds.length);
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

  onRuntimeMessage(request, sender, sendResponse) {
    console.log('Got msg', request, sender, sendResponse);
    if (sender.tab) {
      //process from tabs
      this.onTabMessage(request, sender, sendResponse);
    } else {
      //process from popup (or any other bg-context)
      switch (request.cmd) {
        case 'login':
          return store.dispatch('session/login', request);
          break;
      }
    }
  }
}
