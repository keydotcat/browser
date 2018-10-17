import rootSvc from '@/services/root'
import axios from 'axios'

export default {
  login(username, passwd) {
    var config = rootSvc.getHeaders()
    config['errorPrefix'] = 'login.error.'
    var payload = {id: username, password: password, want_csrf: true}
    return axios.post(rootSvc.urlRoot + '/auth/login', payload, config)
      .then((response) => Promise.resolve(response.data))
      .catch((error) => Promise.reject(error))
  },
}
