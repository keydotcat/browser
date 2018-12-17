import * as mt from '@/store/mutation-types';
import browser from 'webextension-polyfill';
import request from '@/store/services/request';
import keyMgr from '@/store/helpers/keymgr';

const SESSION_STORE_NAME = 'kcSession';

const state = {
  uid: '',
};

const mutations = {
  [mt.SESSION_LOGIN](state, { url, data, keys }) {
    console.log('ls', url, data, keys);
    var sData = {
      sessionToken: data.session_token,
      uid: data.user_id,
      url: url,
      keys: keys.data,
    };
    var container = {};
    container[SESSION_STORE_NAME] = sData;
    browser.storage.local.set(container);
    request.fromJson(sData);
    state.uid = sData.uid;
    console.log('LOGDID', state.uid, ',,');
  },
  [mt.SESSION_EXISTS](state, uid) {
    state.uid = uid;
    console.log('LOGDID', state.uid, ',,');
  },
  [mt.SESSION_LOGOUT](state) {
    state.uid = '';
    browser.storage.local.remove(SESSION_STORE_NAME);
  },
};

const getters = {
  loggedIn: state => {
    console.log('LOGDID', state.uid, ',,');
    return state.uid.length > 0;
  },
};

const actions = {
  loadFromStorage(context) {
    console.log('From storage');
    return browser.storage.local.get(SESSION_STORE_NAME).then(data => {
      if (!(SESSION_STORE_NAME in data)) {
        return;
      }
      console.log('Found stored session');
      var sData = data[SESSION_STORE_NAME];
      console.log('stad', sData);
      request.fromJson(sData);
      return request.get('/auth/session').then(response => {
        console.log('Got session', response);
        return keyMgr.setKeysFromStore(response.data.store_token, sData.keys).then(ok => {
          console.log('Got user', response);
          context.commit(mt.SESSION_EXISTS, sData.uid);
          request.onUnauthorized(() => {
            context.commit(mt.SESSION_LOGOUT);
          });
          return context.dispatch('user/loadInfo', {}, { root: true });
        });
      });
    });
  },
  login(context, { url, user, pass }) {
    console.log('From login');
    request.url = url;
    return keyMgr.hashLoginPassword(user, pass).then(hPass => {
      var payload = { id: user, password: hPass.data, want_csrf: false };
      console.log('Request payload', payload);
      return request
        .post('/auth/login', payload, { errorPrefix: 'login.error' })
        .then(response => {
          console.log('Request ok', response);
          var srvKeys = { publicKeys: response.data.public_key, secretKeys: response.data.secret_key };
          return keyMgr
            .setKeysFromServer(pass, response.data.store_token, srvKeys)
            .then(keysRet => {
              request.onUnauthorized(() => {
                context.commit(mt.SESSION_LOGOUT);
              });
              context.commit(mt.SESSION_LOGIN, { url: url, data: response.data, keys: keysRet });
              return context.dispatch('user/loadInfo', {}, { root: true });
            })
            .catch(err => {
              console.log('Set keys ko', err);
              return { error: err };
            });
        })
        .catch(err => {
          console.log('Request ko', err);
          return { error: request.processError(err) };
        });
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions,
};
