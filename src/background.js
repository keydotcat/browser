import KeyMgr from '@/commonjs/crypto/key_mgr';
import browser from 'webextension-polyfill';
import sessionMgr from '@/background/session';

class BackgroundMgr {
  constructor() {
    this.keyMgr = new KeyMgr();
    sessionMgr.loadFromStorage(this.keyMgr);
  }
}

var mgr = new BackgroundMgr();

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Got msg', request, sender, sendResponse);
  if (sender.tab) {
    //process from tabs
  } else {
    //process from popup (or any other bg-context)
    switch (request.cmd) {
      case 'login':
        return sessionMgr
          .login(mgr.keyMgr, request.url, request.user, request.pass)
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
