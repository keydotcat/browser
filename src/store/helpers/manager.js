import cmds from './commands'
/* eslint import/no-webpack-loader-syntax: off */
import Worker from 'worker-loader!./worker.js'
import toastSvc from '@/services/toast'

class Manager {
  constructor() {
    this.worker = new Worker()
    this.promise_queue = []
    var self = this
    this.worker.onmessage = function(e) {
      if (self.promise_queue < 1) {
        return
      }
      var p = self.promise_queue.shift()
      var payload = e.data
      if (payload.data != null) {
        p.resolve(payload.data)
      } else {
        toastSvc.error('Worker error ' + (e.error || e))
        p.reject(payload)
      }
    }
  }
  newTask(cmd, data) {
    var self = this
    return new Promise(function(resolve, reject) {
      try {
        self.promise_queue.push({ cmd: cmd, resolve: resolve, reject: reject })
        var task = {}
        for (var k in data) {
          task[k] = data[k]
        }
        task.cmd = cmd
        self.worker.postMessage(task)
      } catch (e) {
        toastSvc.error('Worker error ' + e)
      }
    })
  }
  generateUserKey(username, password) {
    return this.newTask(cmds.GEN_KEY, { username: username, password: password })
  }
  generateVaultKeys(adminKeys) {
    return this.newTask(cmds.GEN_VAULT_KEY, { admins: adminKeys })
  }
  hashPassword(username, password) {
    return this.newTask(cmds.HASH_PASS, { username: username, password: password })
  }
  setKeysFromServer(password, storeToken, srvKeys) {
    return this.newTask(cmds.LOAD_KEY_FROM_SERVER, { password: password, storeToken: storeToken, srvKeys: srvKeys })
  }
  setKeysFromStore(storeToken, storedKeys) {
    return this.newTask(cmds.LOAD_KEY_FROM_STORE, { storeToken: storeToken, storedKeys: storedKeys })
  }
  cipherVaultKeysForUser(vaultKeys, pubKey) {
    return this.newTask(cmds.CIPHER_KEYS_FOR_USER, { vaultKeys: vaultKeys, userPublicKeys: pubKey })
  }
  serializeAndClose(vaultKeys, obj) {
    return this.newTask(cmds.SERIALIZE_AND_CLOSE, { vaultKeys: vaultKeys, obj: obj })
  }
  openAndDeserialize(vaultKeys, data) {
    return this.newTask(cmds.OPEN_AND_DESERIALIZE, { vaultKeys: vaultKeys, data: data })
  }
  openAndDeserializeBulk(vsa) {
    return this.newTask(cmds.OPEN_AND_DESERIALIZE_BULK, { vsa: vsa })
  }
  closeKeysWithPassword(username, password) {
    return this.newTask(cmds.CLOSE_KEYS_WITH_PASSWORD, { username: username, password: password })
  }
}

export default new Manager()
