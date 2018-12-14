import browser from 'webextension-polyfill'
import { BrowserApi } from '@/browser/api'

import store from '@/store'

async function onTabMessage(request, sender, sendResponse) {
  switch (request.command) {
    case 'bgCollectPageDetails':
      console.log('srta');
      BrowserApi.tabSendMessage(sender.tab, { command: 'collectPageDetails', tab: sender.tab, sender: request.sender });
      break;
    case 'collectPageDetailsResponse':
      const forms = mgr.autofill.getFormsWithPasswordFields(request.details);
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
        return store.dispatch('session/login',request)
        break
    }
  }
});
