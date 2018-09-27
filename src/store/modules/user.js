import workerMgr from '@/worker/manager'
import userSvc from '@/services/user'
import toastSvc from '@/services/toast'

import router from '@/router'
import * as mt from '@/store/mutation-types'

const state = {
  fullname: '',
  id: '',
  publicKeys: '',
  email: '',
  teams: []
}

const mutations = {
  [mt.USER_LOAD_INFO] (state, payload) {
    state.fullname = payload.fullname
    state.id = payload.id
    state.publicKeys = payload.public_key
    state.email = payload.email
    state.teams.splice(0, state.teams.length)
    for( var i = 0; i < payload.teams.length; i++){
      state.teams.push(payload.teams[i])
    }
  },
  [mt.USER_CLEAR] (state) {
    state.fullname = ''
    state.id = ''
    state.publicKeys = ''
    state.email = ''
    state.teams.splice(0, state.teams.length)
  }
}

const getters = {
  team_ids: state => {
    const teams = [...state.teams].sort((a, b) => {
      if(a.name > b.name){ return 1 }
      if(a.name < b.name){ return -1 }
      return 0
    })
    return teams.map((team) => team.id)
  },
  teams: state => {
    const teams = [...state.teams].sort((a, b) => {
      if(a.name > b.name){ return 1 }
      if(a.name < b.name){ return -1 }
      return 0
    })
    return teams
  },
  allVaults: (state, getters, rootState, rootGetters) => {
    var vaults = []
    getters['team_ids'].forEach((tid) => {
      rootState[`team.${tid}`].vaults.forEach((vault) => {
        vaults.push({
          tid: tid,
          vid: vault.id,
          teamName: rootState[`team.${tid}`].name
        })
      })
    })
    return vaults
  }
}

const actions = {
  loadInfo(context) {
    userSvc.loadInfo().then((info) => {
      context.commit(mt.USER_LOAD_INFO, info)
      router.push('/home/data/locations')
    })
  },
  createTeam(context, payload) {
    var req = {}
    req[context.state.id] = context.state.publicKeys
    workerMgr.generateVaultKeys(req).then((vaultKeys) => {
      userSvc.createTeam({
        name: payload,
        vault_keys: {
          public_key: vaultKeys.publicKey,
          keys: vaultKeys.keys
        }
      }).then((teamInfo) => {
        toastSvc.success('Team created')
        context.dispatch('loadInfo')
      })
    })
  },
  changeEmail(context, email) {
    userSvc.changeEmail(email).then((info) => {
      toastSvc.success('Email change requested')
    })
  },
  changePassword(context, password) {
    return new Promise((resolve, reject) => {
      workerMgr.closeKeysWithPassword(context.state.id, password).then((data) => {
        userSvc.changePassword(data.password, data.keys).then((info) => {
          toastSvc.success('Password changed')
        })
        resolve(data)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions
}
