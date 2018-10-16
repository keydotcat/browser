import workerMgr from '@/worker/manager'
import * as mt from '@/store/mutation-types'

const state = {
  urlRoot: '',
  uid: ''
}

const mutations = {
  [mt.SESSION_SET_URL_ROOT] (state, payload) {
    state.urlRoot = payload
  },
  [mt.SESSION_LOGOUT] (state) {
    //TODO
  }
}

const getters = {
  loggedIn: state => {
    return false
  }
}

const actions = {
  loadInfo(context) {
    //TODO
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions
}