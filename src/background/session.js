import request from '@/background/requests/base';
import browser from 'webextension-polyfill';

const SESSION_STORE_NAME = 'kcLocalSession';

class SessionMgr {
  constructor() {
    this.uid = '';
  }
  loadFromStorage(keyMgr) {
    var self = this;
    return browser.storage.local.get(SESSION_STORE_NAME).then(data => {
      if (!(SESSION_STORE_NAME in data)) {
        return;
      }
      var sData = data[SESSION_STORE_NAME];
      console.log('stad', sData);
      request.fromJson(sData);
      return request.get('/auth/session').then(response => {
        console.log('Got session', response);
        return keyMgr.setKeysFromStore(sData.keys, response.data.store_token).then(ok => {
          console.log('Got session', response);
          this.uid = sData.uid;
        });
      });
    });
  }
  loggedIn() {
    return this.uid.length > 0;
  }
  _enableNewSession(url, data, keys) {
    console.log('Got to log-in', data, keys);
    var sessionData = {
      sessionToken: data.session_token,
      uid: data.user_id,
      url: url,
      csrf: data.csrf,
      keys: keys.data,
    };
    var container = {};
    container[SESSION_STORE_NAME] = sessionData;
    browser.storage.local.set(container);
    request.fromJson(sData);
    this.uid = sessionData.uid;
    return { data: this.uid };
  }
  login(keyMgr, url, user, pass) {
    request.url = url;
    var self = this;
    return keyMgr
      .hashLoginPassword(user, pass)
      .then(hPass => {
        var payload = { id: user, password: hPass.data, want_csrf: true };
        console.log('Request payload', payload);
        return request
          .post('/auth/login', payload, { errorPrefix: 'login.error' })
          .then(response => {
            console.log('Request ok', response);
            var srvKeys = { publicKeys: response.data.public_key, secretKeys: response.data.secret_key };
            console.log('SKFS', pass, response.data.store_token, srvKeys);
            return keyMgr
              .setKeysFromServer(pass, response.data.store_token, srvKeys)
              .then(keysRet => {
                console.log('ALLOK', keysRet);
                return self._enableNewSession(url, response.data, keysRet);
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
      })
      .catch(error => {
        return { error: request.processError(err) };
      });
  }
}

export default new SessionMgr();
