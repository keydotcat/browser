import workerMgr from '@/worker/manager'
import rootSvc from '@/services/root'
import * as mt from '@/store/mutation-types'

const state = {
  working: false,
  urlRoot: '',
  uid: ''
}

const mutations = {
  [mt.SESSION_SET_URL_ROOT] (state, payload) {
    state.urlRoot = payload
  },
  [mt.SESSION_START_WORK] (state) {
    state.working = true
  },
  [mt.SESSION_STOP_WORK] (state) {
    state.working = false
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
  },
  login (context, {url = '', username, password }) {
    return Promise.new((resolve,reject) => {
      rootSvc.setUrlRoot(url + '/api')
      context.commit(mt.SESSION_START_WORK)
      workerMgr.hashPassword(username, password).then((hPass) => {
        authSvc.login(username, hPass)
          .then((response) => {
            context.dispatch('session/'+mt.SESSION_LOGIN, {
              sessionData: response,
              password: payload.password,
              csrf: response.csrf
            }).then(() => {
              context.commit(mt.SESSION_STOP_WORK)
              resolve()
            }).catch(() => {
              context.commit(mt.SESSION_STOP_WORK)
              reject()
            })
          }).catch(() => {
            context.commit(mt.SESSION_STOP_WORK)
            reject()
          })
      }).catch(() => {
        context.commit(mt.SESSION_STOP_WORK)
        reject()
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