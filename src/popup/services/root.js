class RootSvc {
  constructor() {
    this.urlRoot = '';
    this.csrf = '';
  }
  setUrlRoot(ur) {
    this.urlRoot = ur;
  }
  setCsrf(c) {
    this.csrf = c;
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
}
export default new RootSvc();
