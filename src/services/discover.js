import axios from 'axios'

export default {
  isKeyCat(url) {
    console.log('target is' + url + '/api/version')
    return axios.get(url + '/api/version')
      .then((response) => {
        if (response.data.name == 'Key cat') {
          console.log('axion2', response.data)
          return Promise.resolve(response.data)
        } else {
          return Promise.reject(false)
        }
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }
}
