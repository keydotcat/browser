import request from '@/background/requests/base';

class SecretsMgr {
  constructor(keyMgr, teamMgr) {
    this.secrets = {};
    this.keyMgr = keyMgr;
    this.teamMgr = teamMgr;
  }
  getAll() {
    this.secrets = {};
    var proms = this.teamMgr.teamIds().map(tid => {
      return request.get(`/team/${tid}/secret`).then(response => {
        console.log('secret', response);
      });
    });
    return Promise.all(proms);
  }
}

export default SecretsMgr;
