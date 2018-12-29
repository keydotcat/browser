import request from './request'

export default {
  register(payload) {
    return request
      .post('/auth/register', payload)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  login(payload) {
    var config = { errorPrefix: 'login.error.' }
    return request
      .post('/auth/login', payload, config)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  confirmEmail(payload) {
    return request
      .get('/auth/confirm_email/' + payload.token)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  resendConfirmEmail(payload) {
    return request
      .post('/auth/request_confirmation_token', payload)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  getSession(payload) {
    return request
      .get(`/auth/session`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  }
}
