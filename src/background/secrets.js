import request from '@/background/requests/base';

class SecretsMgr {
  constructor(keyMgr, teamMgr) {
    this.secrets = {};
    this.keyMgr = keyMgr;
    this.teamMgr = teamMgr;
  }
  getAll() {
    var self = this;
    this.secrets = {};
    var proms = this.teamMgr.teamIds().map(tid => {
      console.log('Getting secrets for team', tid);
      return request.get(`/team/${tid}/secret`).then(response => {
        var closed = response.data.secrets;
        var vsa = closed.map(secret => {
          return {
            v: self.teamMgr.getKey(tid, secret.vault),
            s: secret.data,
          };
        });
        var opened = self.keyMgr.openAndDeserializeBulk(vsa).data;
        for (var i = 0; i < opened.length; i++) {
          self.registerSecret(tid, closed[i].vault, closed[i].id, opened[i]);
        }
      });
    });
    return Promise.all(proms);
  }
  registerSecret(tid, vid, sid, os) {
    if (os.type !== 'location') {
      return;
    }
    this.secrets[`${tid}:${vid}:${sid}`] = os;
    console.log('Registered secret', this.secrets);
  }
}

export default SecretsMgr;
