import axios from 'axios'

export default {
  isKeyCat(url) {
    return axios
      .get(url + '/api/version')
      .then(response => {
        if (response.data.name === 'KeyCat') {
          return Promise.resolve(response.data)
        } else {
          return Promise.reject(false)
        }
      })
      .catch(err => {
        return Promise.reject(err)
      })
  }
}
