import teamSvc from '@/store/services/team'
import keyMgr from '@/store/helpers/keymgr'
import Secret from '@/commonjs/secrets/secret'
import toastMgr from '@/store/helpers/toast'
import * as mt from '@/store/mutation-types'
import Vue from 'vue'

const state = () => {
  return {
    secrets: {},
    labels: {},
    loading: 0
  }
}

function removeLabelsFromState(state, secret) {
  secret.data.labels.forEach((label) => {
    if(!(label in state.labels)) {
      return
    }
    var fullId = secret.fullId
    var fi = state.labels[label].indexOf(fullId)
    if(fi > -1) {
      state.labels[label].splice(fi, 1)
    }
    if(state.labels[label].length === 0) {
      Vue.delete(state.labels, label)
    }
  })
}

function addLabelsToState(state, secret) {
  secret.data.labels.forEach((label) => {
    if(!(label in state.labels)) {
      Vue.set(state.labels, label, [])
    }
    var fullId = secret.fullId
    var fi = state.labels[label].indexOf(fullId)
    if(fi === -1) {
      state.labels[label].push(fullId)
    }
  })
}

function addSecret(state, teamId, secret, openData) {
  var secretObj = new Secret({
    secretId: secret.id,
    vaultId: secret.vault,
    teamId: teamId,
    vaultVersion: secret.vault_version,
    createdAt: secret.created_at,
    updatedAt: secret.updated_at,
    data: openData
  })
  if(secretObj.fullId in state.secrets) {
    removeLabelsFromState(state, secretObj)
  }
  Vue.set(state.secrets, secretObj.fullId, secretObj)
  addLabelsToState(state, secretObj)
}

const mutations = {
  [mt.SECRET_SET_LOADING] (state, loading) {
    state.loading += loading
  },
  [mt.SECRET_CLEAR_ALL] () {
    state.secrets = {}
    state.labels = {}
  },
  [mt.SECRET_SET] (state, { teamId, secret, openData }) {
    addSecret(state, teamId, secret, openData)
  },
  [mt.SECRET_SET_BULK] (state, secretList) {
    secretList.forEach((data) => {
      addSecret(state, data.teamId, data.secret, data.openData)
    })
  },
  [mt.SECRET_UNSET] (state, { teamId, vaultId, secretId }) {
    var sid = `${teamId}.${vaultId}.${secretId}`
    var secret = state.secrets[sid]
    removeLabelsFromState(state, secret)
    Vue.delete(state.secrets, sid)
  }
}

function filterPass( secret, filter ) {
  if( filter.labels && filter.labels.length > 0 ) {
    var found = secret.data.labels.filter( label => {
      return filter.labels.indexOf(label) > -1
    }).length > 0
    if( !found ) {
      return false
    }
  }
  if( filter.teams && filter.teams.length > 0 ) {
    if( filter.teams.indexOf(secret.teamId) === -1 ) {
      return false
    }
  }
  if( filter.vaults && filter.vaults.length > 0 ) {
    if( filter.vaults.indexOf( `${secret.teamId}/${secret.vaultId}` ) === -1 ) {
      return false
    }
  }
  return ( ((filter.search || '').length === 0) || ( secret.data.name || '' ).toLowerCase().indexOf( filter.search.toLowerCase() ) > -1 )
}

const getters = {
  filteredSecrets: state => {
    return (type, filter) => {
      var filtered = []
      for( var sid in state.secrets ) {
        var sec = state.secrets[sid]
        if( sec.data.type === type && filterPass( sec, filter ) ) {
          filtered.push(sec)
        }
      }
      return filtered
    }
  },
  allLabels: state => {
    return Object.keys(state.labels).sort()
  }
}

var gVKeys = {}

function getVaultKeyFromList( vaults, tid, vid ) {
  var key = `${tid}.${vid}`
  if( !(key in gVKeys) ) {
    vaults.forEach((vault) => {
      if( vid === vault.id ) {
        gVKeys[key] = {
          publicKeys: vault.public_key,
          secretKeys: vault.key
        }
      }
    })
  }
  return gVKeys[key]
}

function updateOrCreate(context, ftor, tid, vid, sid, data) {
  return new Promise((resolve, reject) => {
    if(typeof data.cloneAsObject !== 'function') {
      throw new Error('Expected SecretData object')
    }
    var vKeys = getVaultKeyFromList(context.rootState[`team.${tid}`].vaults, tid, vid)
    keyMgr.serializeAndClose(vKeys, data.cloneAsObject()).then((closedData) => {
      ftor({ teamId: tid, vaultId: vid, secretId: sid, payload: closedData }).then((secret) => {
        keyMgr.openAndDeserialize(vKeys, secret.data).then((openData) => {
          context.commit(mt.SECRET_SET, { teamId: tid, secret: secret, openData: data })
          resolve(secret)
        })
      }).catch((err) => {
        reject(err)
      })
    })
  })
}

function unpackTeamSecrets( context, teamId, vaults, resp ) {
  var vsa = resp.secrets.map((secret) => {
    return {
      v: getVaultKeyFromList( vaults, teamId, secret.vault ),
      s: secret.data
    }
  })
  context.commit(mt.SECRET_SET_LOADING, 1)
  return keyMgr.openAndDeserializeBulk(vsa).then((dataList) => {
    dataList.forEach((data, ip) => {
      context.commit(mt.SECRET_SET, { teamId: teamId, secret: resp.secrets[ip], openData: data })
    })
    toastMgr.success('Import successful')
    context.commit(mt.SECRET_SET_LOADING, -1)
  })
}

const actions = {
  loadSecretsFromTeam(context, { teamId, vaults }) {
    teamSvc.loadSecrets(teamId).then((resp) => {
      var vsa = resp.secrets.map((secret) => {
        return {
          v: getVaultKeyFromList( vaults, teamId, secret.vault ),
          s: secret.data
        }
      })
      context.commit(mt.SECRET_SET_LOADING, vsa.length)
      keyMgr.openAndDeserializeBulk(vsa).then((dataList) => {
        context.commit(mt.SECRET_SET_BULK, dataList.map((data, ip) => {
          return { teamId: teamId, secret: resp.secrets[ip], openData: data }
        }))
        context.commit(mt.SECRET_SET_LOADING, -vsa.length)
      })
    })
  },
  update(context, { teamId, vaultId, secretId, secretData }) {
    return updateOrCreate(context, teamSvc.updateSecret, teamId, vaultId, secretId, secretData)
  },
  create(context, { teamId, vaultId, secretData }) {
    return updateOrCreate(context, teamSvc.createSecret, teamId, vaultId, '', secretData)
  },
  createList(context, { teamId, vaultId, secretList }) {
    var vKeys = getVaultKeyFromList(context.rootState[`team.${teamId}`].vaults, teamId, vaultId)
    var proms = secretList.map( data => {
      return keyMgr.serializeAndClose(vKeys, data.cloneAsObject())
    })
    return Promise.all( proms ).then( closedList => {
      var payload = closedList.map(c => { return { data: c } })
      return teamSvc.createSecretList({ teamId: teamId, vaultId: vaultId, payload: payload }).then(resp => {
        return unpackTeamSecrets(context, teamId, context.rootState[`team.${teamId}`].vaults, resp)
      })
    })
  },
  delete(context, { teamId, vaultId, secretId }) {
    teamSvc.deleteSecret(teamId, vaultId, secretId).then((resp) => {
      context.commit(mt.SECRET_UNSET, { teamId: teamId, vaultId: vaultId, secretId: secretId })
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
