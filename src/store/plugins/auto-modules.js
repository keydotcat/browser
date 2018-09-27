import * as mt from '@/store/mutation-types'
import TeamModule from '@/store/modules/templates/team.js'

class ModuleLoader {
  constructor(store) {
    this.store = store
    this.teams = {}
  }
  syncTeams(teams){
    for(var i = 0; i < teams.length; i++) {
      var tid = teams[i].id
      if(tid in this.teams) {
        continue
      }
      var mid = 'team.' + tid
      this.teams[tid] = []
      this.store.registerModule(mid, TeamModule)
      this.store.dispatch(`${mid}/loadInfo`, tid)
    }
  }
  logout(){
    for(var tid in this.teams) {
      var mid = 'team.' + tid
      this.store.unregisterModule(mid)
    }
    this.teams = {}
  }
}

export default store => {
  var ml = new ModuleLoader(store)
  store.subscribe((mutation, state) => {
    if (mutation.type === 'user/' + mt.USER_LOAD_INFO) {
      ml.syncTeams(state.user.teams)
    }
    if (mutation.type === mt.SESSION_LOGOUT) {
      ml.logout()
    }
  })
}
