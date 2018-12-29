import request from './request'

export default {
  loadInfo(tid) {
    return request
      .get('/team/' + tid)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  invite(tid, invite) {
    return request
      .post('/team/' + tid + '/user', { invite: invite })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  promoteUser(tid, uid, keys) {
    var payload = {
      admin: true,
      keys: keys
    }
    return request
      .patch(`/team/${tid}/user/${uid}`, payload)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  demoteUser(tid, uid) {
    var payload = {
      admin: false
    }
    return request
      .patch(`/team/${tid}/user/${uid}`, payload)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  addUserToVault(tid, vid, userKeys) {
    return request
      .post(`/team/${tid}/vault/${vid}/user`, userKeys)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  removeUserFromVault(tid, vid, uid) {
    return request
      .delete(`/team/${tid}/vault/${vid}/user/${uid}`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  createVault(tid, vid, vaultKeys) {
    return request
      .post(`/team/${tid}/vault`, { name: vid, vault_keys: vaultKeys })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  createSecret({ teamId, vaultId, payload }) {
    return request
      .post(`/team/${teamId}/vault/${vaultId}/secret`, { data: payload })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  createSecretList({ teamId, vaultId, payload }) {
    return request
      .post(`/team/${teamId}/vault/${vaultId}/secrets`, { secrets: payload })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  updateSecret({ teamId, vaultId, secretId, payload }) {
    return request
      .put(`/team/${teamId}/vault/${vaultId}/secret/${secretId}`, { data: payload })
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  deleteSecret(tid, vid, sid) {
    return request
      .delete(`/team/${tid}/vault/${vid}/secret/${sid}`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  },
  loadSecrets(tid) {
    return request
      .get(`/team/${tid}/secret`)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  }
}
