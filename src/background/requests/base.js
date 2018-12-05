import axios from 'axios';

class RequestBase {
  constructor(url, csrf) {
    this.url = '';
    this.csrf = '';
    this.sessionToken = '';
  }
  loggedIn() {
    return this.sessionToken.length > 0;
  }
  toJson() {
    return JSON.stringify({
      url: this.url,
      csrf: this.csrf,
      sessionToken: this.sessionToken,
    });
  }
  fromJson(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    this.url = data.url;
    this.csrf = data.csrf;
    this.sessionToken = data.sessionToken;
  }
  getHeaders() {
    var headers = {};
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }
    if (this.csrf) {
      headers['X-Csrf-Token'] = this.csrf;
    }
    return { headers: headers };
  }
  processError(httpError, prefix) {
    debugger;
    if (!httpError.response) {
      return 'errors.network';
    }
    var data = httpError.response.data;
    if (data === null || !data.error) {
      switch (httpError.code) {
        case '401':
          return 'errors.unauthorized';
        case '400':
          return 'errors.bad_request';
        case '500':
          return 'errors.server';
      }
      return 'errors.unknown';
    }
    //switch(errResponse.status ==
    return (prefix || 'errors.') + data.error.toLowerCase().replace(new RegExp(' ', 'g'), '_');
  }
  post(path, payload, config = {}) {
    var merged = { ...this.getHeaders(), ...config };
    return axios.post(this.url + path, payload, merged);
  }
  get(path, config = {}) {
    var merged = { ...this.getHeaders(), ...config };
    return axios.get(this.url + path, merged);
  }
}

export default new RequestBase();
