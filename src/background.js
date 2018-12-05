import mgr from '@/background/manager';
import browser from 'webextension-polyfill';

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Got msg', request, sender, sendResponse);
  if (sender.tab) {
    //process from tabs
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
