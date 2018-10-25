import KeyMgr from '@/commonjs/crypto/key_mgr';
import browser from 'webextension-polyfill';

class BackgroundMgr {
  constructor() {
    this.keyMgr = new KeyMgr();
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
      case 'hashLogin':
        console.log('harsth');
        mgr.keyMgr.hashLoginPassword(request.user, request.pass).then(p => {
          sendResponse(p);
        });
        break;
    }
  }
});
