import KeyMgr from '@/commonjs/crypto/key_mgr';
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
      if (!ok) {
        return;
      }
      return this.teams.loadFromServer().then(ok => {
        return this.secrets.getAll();
      });
    });
  }
}

export default new BackgroundMgr();
