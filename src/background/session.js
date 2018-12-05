import request from '@/background/requests/base';
import browser from 'webextension-polyfill';

const SESSION_STORE_NAME = 'kcLocalSession';

class SessionMgr {
  constructor(keyMgr) {
    this.uid = '';
    this.keyMgr = keyMgr;
    request.onUnauthorized(() => {
      this.forget();
    });
  }
  forget() {
    console.log('Forgetting session');
    this.uid = '';
    browser.storage.local.remove(SESSION_STORE_NAME);
  }
  loadFromStorage() {
    var self = this;
    return browser.storage.local.get(SESSION_STORE_NAME).then(data => {
      if (!(SESSION_STORE_NAME in data)) {
        console.log('No session found');
        return false;
      }
      console.log('Found stored session');
      var sData = data[SESSION_STORE_NAME];
      console.log('stad', sData);
      request.fromJson(sData);
      return request.get('/auth/session').then(response => {
        console.log('Got session', response);
        return self.keyMgr.setKeysFromStore(sData.keys, response.data.store_token).then(ok => {
          console.log('Got user', response);
          self.uid = sData.uid;
          return true;
        });
      });
    });
  }
  loggedIn() {
    return this.uid.length > 0;
  }
  _enableNewSession(url, data, keys) {
    console.log('Got to log-in', data, keys);
    var sData = {
      sessionToken: data.session_token,
      uid: data.user_id,
      url: url,
      //csrf: data.csrf,
      keys: keys.data,
    };
    var container = {};
    container[SESSION_STORE_NAME] = sData;
    browser.storage.local.set(container);
    request.fromJson(sData);
    this.uid = sData.uid;
    return { data: this.uid };
  }
  login(url, user, pass) {
    request.url = url;
    var self = this;
    return self.keyMgr
      .hashLoginPassword(user, pass)
      .then(hPass => {
        var payload = { id: user, password: hPass.data, want_csrf: false };
        console.log('Request payload', payload);
        return request
          .post('/auth/login', payload, { errorPrefix: 'login.error' })
          .then(response => {
            console.log('Request ok', response);
            var srvKeys = { publicKeys: response.data.public_key, secretKeys: response.data.secret_key };
            console.log('SKFS', pass, response.data.store_token, srvKeys);
            return self.keyMgr
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
      .catch(err => {
        return { error: request.processError(err) };
      });
  }
}

export default SessionMgr;
