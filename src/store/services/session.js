import request from './request'

export default {
  getSessionData(payload) {
    return request
      .get(`/session/${payload.token}`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  deleteSession(payload) {
    return request
      .delete(`/session/${payload.token}`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  }
}
