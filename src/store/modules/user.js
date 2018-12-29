import keyMgr from '@/store/helpers/keymgr'
import toastMgr from '@/store/helpers/toast'
import userSvc from '@/store/services/user'

import * as mt from '@/store/mutation-types'

const state = {
  fullname: '',
  id: '',
  publicKeys: '',
  email: '',
  teams: []
}

const mutations = {
  [mt.USER_LOAD_INFO](state, payload) {
    state.fullname = payload.fullname
    state.id = payload.id
    state.publicKeys = payload.public_key
    state.email = payload.email
    state.teams.splice(0, state.teams.length)
    for (var i = 0; i < payload.teams.length; i++) {
      state.teams.push(payload.teams[i])
    }
  },
  [mt.USER_CLEAR](state) {
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
      if (a.name > b.name) {
        return 1
      }
      if (a.name < b.name) {
        return -1
      }
      return 0
    })
    return teams.map(team => team.id)
  },
  teams: state => {
    const teams = [...state.teams].sort((a, b) => {
      if (a.name > b.name) {
        return 1
      }
      if (a.name < b.name) {
        return -1
      }
      return 0
    })
    return teams
  },
  allVaults: (state, getters, rootState, rootGetters) => {
    var vaults = []
    getters['team_ids'].forEach(tid => {
      rootState[`team.${tid}`].vaults.forEach(vault => {
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
    return userSvc.loadInfo().then(info => {
      context.commit(mt.USER_LOAD_INFO, info)
      return { ok: true }
    })
  },
  createTeam(context, payload) {
    var req = {}
    req[context.state.id] = context.state.publicKeys
    keyMgr.generateVaultKeys(req).then(vaultKeys => {
      userSvc
        .createTeam({
          name: payload,
          vault_keys: {
            public_key: vaultKeys.publicKey,
            keys: vaultKeys.keys
          }
        })
        .then(teamInfo => {
          toastMgr.success('Team created')
          context.dispatch('loadInfo')
        })
    })
  },
  changeEmail(context, email) {
    userSvc.changeEmail(email).then(info => {
      toastMgr.success('Email change requested')
    })
  },
  changePassword(context, password) {
    return new Promise((resolve, reject) => {
      keyMgr.closeKeysWithPassword(context.state.id, password).then(data => {
        userSvc.changePassword(data.password, data.keys).then(info => {
          toastMgr.success('Password changed')
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
