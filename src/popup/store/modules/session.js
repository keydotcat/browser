//import workerMgr from '@/worker/manager'
import rootSvc from '@/popup/services/root';
import * as mt from '@/popup/store/mutation-types';
import localStore from '@/local_store';
import browser from 'webextension-polyfill';

const state = {
  urlRoot: '',
  sessionToken: '',
};

const mutations = {
  [mt.SESSION_SET_URL_ROOT](state, payload) {
    state.urlRoot = payload;
  },
  [mt.SESSION_LOGIN](state, payload) {
    localStore.store(payload);
    state.sessionToken = payload.token;
    rootSvc.setToken(state.sessionToken);
    if (payload.csrf) {
      rootSvc.setCsrf(payload.csrf);
    }
  },
  [mt.SESSION_LOGOUT](state) {
    //TODO
  },
};

const getters = {
  loggedIn: state => {
    return false;
  },
};

const actions = {
  loadInfo(context) {
    //TODO
  },
  login(context, { url, username, password }) {
    rootSvc.setUrlRoot(url + '/api');
    return browser.runtime.sendMessage({ cmd: 'hashLogin', user: username, pass: password }).then(resp => {
      console.log('LOOLJ', resp);
    });
    /*return workerMgr.hashPassword(username, password).then((hPass) => {
      return authSvc.login(username, hPass).then((response) => {
        //var data = { sessionData: response, password: password, csrf: response.csrf, url: url }
        var srvKeys = { publicKeys: response.public_key, secretKeys: response.secret_key }
        return workerMgr.setKeysFromServer( password, response.store_token, srvKeys ).then((storedKeys) => {
          var sData = { keys: storedKeys, uid: response.user_id, token: response.session_token, url: rootSvc.urlRoot, csrf: response.csrf }
          context.commit(mt.SESSION_LOGIN, sData)
        })
      })
    })*/
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions,
};
