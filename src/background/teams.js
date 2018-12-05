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
          console.log('Got data for team', response.data.id);
          self.teams[response.data.id] = response.data;
        });
      });
      return Promise.all('rast', proms);
    });
  }
  teamIds() {
    return Object.keys(this.teams);
  }
}

export default TeamsMgr;
