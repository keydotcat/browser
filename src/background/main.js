import browser from 'webextension-polyfill';
import { BrowserApi } from '@/browser/api';
import AutofillMgr from '@/background/autofill';

import store from '@/store';
import VuexWebExtensions from 'vuex-webextensions';
import IconMgr from '@/background/icon';

var autofill = new AutofillMgr();
var iconMgr = new IconMgr();

iconMgr.setOffIcon();

VuexWebExtensions({ persistentStates: ['kcPersistentStore'] })(store);
iconMgr.subscribeToStore(store);

store.dispatch('session/loadFromStorage').then(res => {
  console.log('loadFromStorage', res);
});

async function onTabMessage(request, sender, sendResponse) {
  switch (request.command) {
    case 'bgCollectPageDetails':
      console.log('srta');
      BrowserApi.tabSendMessage(sender.tab, { command: 'collectPageDetails', tab: sender.tab, sender: request.sender });
      break;
    case 'collectPageDetailsResponse':
      const forms = autofill.getFormsWithPasswordFields(request.details);
      await BrowserApi.tabSendMessageData(request.tab, 'notificationBarPageDetails', {
        details: request.details,
        forms: forms,
      });
      break;
  }
}

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Got msg', request, sender, sendResponse);
  if (sender.tab) {
    //process from tabs
    onTabMessage(request, sender, sendResponse);
  } else {
    //process from popup (or any other bg-context)
    switch (request.cmd) {
      case 'login':
        return store.dispatch('session/login', request);
        break;
    }
  }
});
