import request from '@/background/requests/base';

class TeamsMgr {
  constructor() {
    this.teams = {};
  }
  loadFromServer() {
    var self = this;
    return request.get('/user').then(response => {
      var proms = response.data.teams.map(t => {
        return request.get('/team/' + t.id).then(response => {
          console.log('Got data for team', response.data);
          self.teams[response.data.id] = response.data;
        });
      });
      return Promise.all(proms);
    });
  }
  teamIds() {
    return Object.keys(this.teams);
  }
  getKey(tid, vid) {
    var k = {};
    this.teams[tid].vaults.forEach(v => {
      if (v.id === vid) {
        k.publicKeys = v.public_key;
        k.secretKeys = v.key;
      }
    });
    return k;
  }
}

export default TeamsMgr;
