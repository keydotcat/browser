import KeyMgr from '@/commonjs/crypto/key_mgr';
import browser from 'webextension-polyfill';
import SessionMgr from '@/background/session';
import SecretsMgr from '@/background/secrets';
import TeamsMgr from '@/background/teams';

class BackgroundMgr {
  constructor() {
    this.keyMgr = new KeyMgr();
    this.teams = new TeamsMgr();
    this.session = new SessionMgr(this.keyMgr);
    this.secrets = new SecretsMgr(this.keyMgr, this.teams);
    this.session.loadFromStorage(this.keyMgr).then(ok => {
      return this.teams.loadFromServer().then(ok => {
        return this.secrets.getAll();
      });
    });
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
