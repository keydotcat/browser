import workerMgr from '@/worker/manager'
import rootSvc from '@/services/root'
import sessionSvc from '@/services/session'
import authSvc from '@/services/auth'
import * as mt from '@/store/mutation-types'
import router from '@/router'

const LS_KEYCAT_URL_ROOT = 'lsKeyCatUrlRoot'
const LS_KEYCAT_SESSION_DATA = 'lsKeyCatSessionData'

const state = {
  loading: false,
  urlRoot: '',
  sessionToken: ''
}

const mutations = {
  [mt.SESSION_LOAD_STATE_FROM_STORAGE] (state) {
    var urlRoot = localStorage.getItem(LS_KEYCAT_URL_ROOT)
    if( urlRoot === null ) {
      if (process.env.NODE_ENV === 'development') {
        urlRoot = 'http://localhost:23764/api'
      } else if (process.env.IS_WEB) {
        urlRoot = window.location.origin + window.location.pathname + 'api'
      } else {
        urlRoot = 'https://pen.key.cat/api'
      }
    }
    state.urlRoot = urlRoot
    rootSvc.setUrlRoot(urlRoot)
  },
  [mt.SESSION_SET_URL_ROOT] (state, urlRoot) {
    state.urlRoot = urlRoot
    rootSvc.setUrlRoot(urlRoot)
    localStorage.setItem(LS_KEYCAT_URL_ROOT, urlRoot)
  },
  [mt.SESSION_LOGOUT] (state) {
    state.sessionToken = ''
    rootSvc.setToken(state.sessionToken)
    localStorage.removeItem(LS_KEYCAT_SESSION_DATA)
  },
  [mt.SESSION_LOGIN] (state, payload) {
    state.sessionToken = payload.token
    rootSvc.setToken(state.sessionToken)
    if( payload.csrf ) {
      rootSvc.setCsrf(payload.csrf)
    }
  },
  [mt.SESSION_SET_LOADING] (state, loading) {
    state.loading = loading
  }
}

const actions = {
  sessionStoreServerSession (context, payload) {
    return new Promise((resolve, reject) => {
      var srvKeys = { publicKeys: payload.sessionData.public_key, secretKeys: payload.sessionData.secret_key }
      workerMgr.setKeysFromServer( payload.password, payload.sessionData.store_token, srvKeys ).then((storedKeys) => {
        var sData = { keys: storedKeys, uid: payload.sessionData.user_id, token: payload.sessionData.session_token }
        localStorage.setItem(LS_KEYCAT_SESSION_DATA, JSON.stringify(sData))
        context.commit(mt.SESSION_LOGIN, {token: payload.sessionData.session_token, csrf: payload.csrf})
        resolve()
      }).catch((err) => {
        reject(err)
      })
    })
  },
  sessionLoadFromLocalStorage (context) {
    context.commit(mt.SESSION_LOAD_STATE_FROM_STORAGE)
    var stub = localStorage.getItem(LS_KEYCAT_SESSION_DATA)
    if( !stub || stub.length === 0 ) {
      context.commit(mt.SESSION_SET_LOADING, false)
      return
    }
    var data = JSON.parse( stub )
    context.commit(mt.SESSION_LOGIN, data)
    authSvc.getSession().then((sessionData) => {
      if( sessionData.csrf ) {
        rootSvc.setCsrf(sessionData.csrf)
      }
      workerMgr.setKeysFromStore( sessionData.store_token, data.keys ).then((ok) => {
        router.push('/home')
        context.commit(mt.SESSION_SET_LOADING, false)
      })
    }).catch(() => {
      context.commit(mt.SESSION_LOGOUT)
      context.commit(mt.SESSION_SET_LOADING, false)
    })
  },
  sessionLogout (context) {
    sessionSvc.deleteSession({token: context.state.sessionToken}).then(() => {
      context.commit(mt.SESSION_LOGOUT)
      context.commit('secrets/' + mt.SECRET_CLEAR_ALL)
      context.commit('user/' + mt.USER_CLEAR)
      router.push('/')
    })
  }
}

export default {
  state,
  mutations,
  actions
}
