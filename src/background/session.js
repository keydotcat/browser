import request from '@/background/requests/base';
import browser from 'webextension-polyfill';

const SESSION_STORE_NAME = 'kc-session';

class SessionMgr {
  constructor() {
    this.initProm = browser.storage.local.get(SESSION_STORE_NAME).then(data => {
      if (SESSION_STORE_NAME in data) {
        request.fromJson(data[SESSION_STORE_NAME]);
        return true;
      }
      return false;
    });
  }
  dumpToStorage() {
    browser.storage.local.set(SESSION_STORE_NAME, request.toJson());
  }
  loggedIn() {
    return request.loggedIn();
  }
  logIn(data) {
    request.csrf = data.csrf;
    request.sessionToken = data.sessionToken;
    return data;
  }
  login(url, user, pass) {
    request.url = url;
    var self = this;
    var payload = { id: user, password: pass, want_csrf: true };
    return request
      .post('/auth/login', payload, { errorPrefix: 'login.error' })
      .then(response => {
        console.log('GOT RESPONSE', response);
        return self.logIn(response.data);
      })
      .catch(error => {
        return Promise.reject(request.processError(error));
      });
  }
}

export default new SessionMgr();
