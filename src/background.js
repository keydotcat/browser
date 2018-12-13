import mgr from '@/background/manager';
import browser from 'webextension-polyfill';
import { BrowserApi } from '@/browser/api';

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
        return mgr.session
          .login(request.url, request.user, request.pass)
          .then(data => {
            //TODO: unpack keyc and store
            console.log('login all ok', data);
            return data;
          })
          .catch(err => {
            console.log('sesserer', err);
            return { error: err };
          });
    }
  }
});
