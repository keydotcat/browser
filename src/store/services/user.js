import request from './request'

export default {
  loadInfo() {
    return request
      .get('/user')
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  createTeam(request) {
    return request
      .post('/team', request)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  changeEmail(email) {
    return request
      .put('/user', { email: email })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  changePassword(password, keys) {
    return request
      .put('/user', { password: password, user_keys: keys })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  }
}
