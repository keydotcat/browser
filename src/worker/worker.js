import cmds from './commands'
import nacl from 'tweetnacl'
import util from 'tweetnacl-util'
import argon2 from 'argon2-browser'

function merge (a, b) {
  var c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}

async function keyPassword (keys, password) {
  /*var bPass = util.decodeUTF8(password)
  var hHash = nacl.hash(merge(keys.sign.publicKey, bPass))
  return hHash.subarray(0, nacl.secretbox.keyLength)
  */
  var res = await argon2.hash({
    // required
    pass: util.decodeUTF8(password),
    salt: keys.sign.publicKey,
    // optional
    time: 3, // the number of iterations
    mem: 2 * 1024, // used memory, in KiB
    hashLen: nacl.secretbox.keyLength, // desired hash length
    parallelism: 1, // desired parallelism (will be computed in parallel only for PNaCl)
    type: argon2.ArgonType.Argon2i, // or argon2.ArgonType.Argon2d
    distPath: '.'
  })
  return res.hash
}

async function loginPassword (username, password) {
  /*var bUser = util.decodeUTF8(username)
  var bPass = util.decodeUTF8(password)
  return util.encodeBase64(nacl.hash(merge(bUser, bPass)))
  */
  var salt = username
  while(salt.length < 128) {
    salt = salt + username
  }
  var res = await argon2.hash({
    // required
    pass: util.decodeUTF8(password),
    salt: util.decodeUTF8(salt),
    // optional
    time: 3, // the number of iterations
    mem: 2 * 1024, // used memory, in KiB
    hashLen: 18, // desired hash length
    parallelism: 1, // desired parallelism (will be computed in parallel only for PNaCl)
    type: argon2.ArgonType.Argon2i, // or argon2.ArgonType.Argon2d
    distPath: '.'
  })
  return util.encodeBase64(res.hash)
}

// signPub + sign( cipherPub ) + sign( nonce + secretbox( signPriv + cipherPriv ) )
function closeUserKeysAndPack (keys, bKey) {
  var nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
  var closedPrivate = merge(nonce, nacl.secretbox(merge(keys.sign.secretKey, keys.cipher.secretKey), nonce, bKey))
  var signedClosedPrivate = nacl.sign(closedPrivate, keys.sign.secretKey)
  return {
    keys: util.encodeBase64(merge(keys.sign.publicKey, merge(nacl.sign(keys.cipher.publicKey, keys.sign.secretKey), signedClosedPrivate))),
    secretKeys: util.encodeBase64(signedClosedPrivate)
  }
}

function packPublicKeys (keys) {
  return util.encodeBase64(merge(keys.sign.publicKey, nacl.sign(keys.cipher.publicKey, keys.sign.secretKey)))
}

// publickKeys is signPub + sign( cipherPub )
// secretKeys is sign( nonce + secretbox( signPriv + cipherPriv ) )
async function unpackAndOpenKeys (srvKeys, password) {
  var pubKeys = util.decodeBase64(srvKeys.publicKeys)
  var keys = {
    sign: {
      publicKey: pubKeys.slice(0, nacl.sign.publicKeyLength)
    },
    cipher: {}
  }
  keys.cipher.publicKey = nacl.sign.open(pubKeys.slice(nacl.sign.publicKeyLength), keys.sign.publicKey)
  if (keys.cipher.publicKey === null) {
    return null
  }
  var verified = nacl.sign.open(util.decodeBase64(srvKeys.secretKeys), keys.sign.publicKey)
  if (verified === null) {
    return null
  }
  keys.cipher.publicKey = verified.slice(0, nacl.box.publicKeyLength)
  var bKey = await keyPassword(keys, password)
  var nonce = verified.slice(0, nacl.secretbox.nonceLength)
  var opened = nacl.secretbox.open(verified.slice(nacl.secretbox.nonceLength), nonce, bKey)
  if (opened == null) {
    return null
  }
  keys.sign.secretKey = opened.slice(0, nacl.sign.secretKeyLength)
  keys.cipher.secretKey = opened.slice(nacl.sign.secretKeyLength)
  if (keys.cipher.secretKey.length !== nacl.box.secretKeyLength) {
    return null
  }
  return keys
}

function unpackPublicKeys (publicStub) {
  var bData = util.decodeBase64(publicStub)
  var keys = {
    sign: bData.slice(0, nacl.sign.publicKeyLength)
  }
  keys.cipher = nacl.sign.open(bData.slice(nacl.sign.publicKeyLength), keys.sign)
  if (keys.cipher === null) {
    return null
  }
  return keys
}

var openedVaultKeys = {}

function hashObject(obj) {
  var hash = 0
  for(var k in obj) {
    var s = obj[k]
    if (s.length === 0) {
      return hash
    }
    for (var i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }
  }
  return hash
}

function unpackAndOpenVaultKeys (vCKeys, userKeys) {
  var vH = hashObject(vCKeys)
  if( vH in openedVaultKeys ) {
    return openedVaultKeys[vH]
  }
  var pubKeys = util.decodeBase64(vCKeys.publicKeys)
  var vKeys = {
    sign: { publicKey: pubKeys.slice(0, nacl.sign.publicKeyLength) },
    cipher: {}
  }
  vKeys.cipher.publicKey = nacl.sign.open(pubKeys.slice(nacl.sign.publicKeyLength), vKeys.sign.publicKey)
  if (vKeys.cipher.publicKey === null) {
    return null
  }
  var verified = nacl.sign.open(util.decodeBase64(vCKeys.secretKeys), vKeys.sign.publicKey)
  if (verified === null) {
    return null
  }
  var nonce = verified.slice(0, nacl.secretbox.nonceLength)
  var opened = nacl.box.open(verified.slice(nacl.secretbox.nonceLength), nonce, vKeys.cipher.publicKey, userKeys.cipher.secretKey)
  if (opened == null) {
    return null
  }
  vKeys.sign.secretKey = opened.slice(0, nacl.sign.secretKeyLength)
  vKeys.cipher.secretKey = opened.slice(nacl.sign.secretKeyLength)
  if (vKeys.cipher.secretKey.length !== nacl.box.secretKeyLength) {
    return null
  }
  openedVaultKeys[vH] = vKeys
  return vKeys
}

class CryptoWorker {
  constructor () {
    this.keys = { sign: {}, cipher: {} }
  }
  async generateUserKeys (username, password) {
    this.keys.sign = nacl.sign.keyPair()
    this.keys.cipher = nacl.box.keyPair()
    var bKey = await keyPassword(this.keys, password)
    var ret = closeUserKeysAndPack(this.keys, bKey)
    ret.publicKeys = packPublicKeys(this.keys)
    ret.password = await loginPassword(username, password)
    return { data: ret }
  }
  async closeKeysWithPassword(username, password) {
    var bKey = await keyPassword(this.keys, password)
    var hPass = await loginPassword(username, password)
    return {
      data: {
        keys: closeUserKeysAndPack(this.keys, bKey).keys,
        password: hPass
      }
    }
  }
  async hashLoginPassword (username, password) {
    var hPass = await loginPassword(username, password)
    return { data: hPass }
  }
  async setKeysFromServer (password, storeToken, srvKeys) {
    this.keys = { sign: {}, cipher: {} }
    this.keys = await unpackAndOpenKeys(srvKeys, password)
    if (this.keys == null) {
      return { error: 'cannot_open_keys' }
    }
    var bToken = await keyPassword(this.keys, storeToken)
    return { data: closeUserKeysAndPack(this.keys, bToken).keys }
  }
  async setKeysFromStore (storedKeys, storeToken) {
    this.keys = { sign: {}, cipher: {} }
    var bKeys = util.decodeBase64(storedKeys)
    var sep = nacl.sign.publicKeyLength + nacl.sign.signatureLength + nacl.box.publicKeyLength
    var keys = {
      publicKeys: util.encodeBase64(bKeys.slice(0, sep)),
      secretKeys: util.encodeBase64(bKeys.slice(sep))
    }
    this.keys = await unpackAndOpenKeys(keys, storeToken)
    if (this.keys == null) {
      return { error: 'cannot_open_keys' }
    }
    return { data: true }
  }
  generateVaultKeys (admins) {
    var vaultKeys = { sign: {}, cipher: {} }
    vaultKeys.sign = nacl.sign.keyPair()
    vaultKeys.cipher = nacl.box.keyPair()
    var secretStub = merge(vaultKeys.sign.secretKey, vaultKeys.cipher.secretKey)
    var signedCipherPubKey = nacl.sign(vaultKeys.cipher.publicKey, vaultKeys.sign.secretKey)
    var data = {
      publicKey: util.encodeBase64(nacl.sign(merge(vaultKeys.sign.publicKey, signedCipherPubKey), this.keys.sign.secretKey)),
      keys: {}
    }
    for (var uname in admins) {
      var pubKeys = unpackPublicKeys(admins[uname])
      var nonce = nacl.randomBytes(nacl.box.nonceLength)
      var closed = nacl.box(secretStub, nonce, pubKeys.cipher, vaultKeys.cipher.secretKey)
      data.keys[uname] = util.encodeBase64(nacl.sign(merge(nonce, closed), vaultKeys.sign.secretKey))
    }
    return { data: data }
  }
  cipherKeysForUser (vaultClosedKeys, userPubKeys) {
    var pubKeys = unpackPublicKeys(userPubKeys)
    var data = {}
    for (var vid in vaultClosedKeys) {
      var vaultKeys = unpackAndOpenVaultKeys(vaultClosedKeys[vid], this.keys)
      var secretStub = merge(vaultKeys.sign.secretKey, vaultKeys.cipher.secretKey)
      var nonce = nacl.randomBytes(nacl.box.nonceLength)
      var closed = nacl.box(secretStub, nonce, pubKeys.cipher, vaultKeys.cipher.secretKey)
      data[vid] = util.encodeBase64(nacl.sign(merge(nonce, closed), vaultKeys.sign.secretKey))
    }
    return {data: data}
  }
  async passwordChange (password) {
    var bKey = await keyPassword(this.keys, password)
    return { data: closeUserKeysAndPack(this.keys, bKey).secretKeys }
  }
  serializeAndClose(vaultClosedKeys, obj) {
    var vaultKeys = unpackAndOpenVaultKeys(vaultClosedKeys, this.keys)
    var serialized = util.decodeUTF8(JSON.stringify(obj))
    var tmpKeys = nacl.box.keyPair()
    var nonce = nacl.randomBytes(nacl.box.nonceLength)
    var closed = nacl.box(serialized, nonce, vaultKeys.cipher.publicKey, tmpKeys.secretKey)
    return {data: util.encodeBase64(nacl.sign(merge(nonce, merge(tmpKeys.publicKey, closed)), vaultKeys.sign.secretKey))}
  }
  openAndDeserialize(vaultClosedKeys, closedData) {
    var vaultKeys = unpackAndOpenVaultKeys(vaultClosedKeys, this.keys)
    var data = nacl.sign.open(util.decodeBase64(closedData), vaultKeys.sign.publicKey)
    var nonce = data.slice(0, nacl.box.nonceLength)
    var tmpPubKey = data.slice(nacl.box.nonceLength, nacl.box.nonceLength + nacl.box.publicKeyLength)
    data = data.slice(nacl.box.nonceLength + nacl.box.publicKeyLength)
    var opened = nacl.box.open(data, nonce, tmpPubKey, vaultKeys.cipher.secretKey)
    return {data: JSON.parse(util.encodeUTF8(opened))}
  }
  openAndDeserializeBulk(vsa) {
    return {
      data: vsa.map((data) => {
        return this.openAndDeserialize(data.v, data.s).data
      })
    }
  }
}
var runner = new CryptoWorker()

self.addEventListener('message', async function (e) {
  try {
    var data = e.data
    switch (data.cmd) {
      case cmds.GEN_KEY:
        self.postMessage(await runner.generateUserKeys(data.username, data.password))
        break
      case cmds.HASH_PASS:
        self.postMessage(await runner.hashLoginPassword(data.username, data.password))
        break
      case cmds.LOAD_KEY_FROM_SERVER:
        self.postMessage(await runner.setKeysFromServer(data.password, data.storeToken, data.srvKeys))
        break
      case cmds.LOAD_KEY_FROM_STORE:
        self.postMessage(await runner.setKeysFromStore(data.storedKeys, data.storeToken))
        break
      case cmds.GEN_VAULT_KEY:
        self.postMessage(runner.generateVaultKeys(data.admins))
        break
      case cmds.CIPHER_KEYS_FOR_USER:
        self.postMessage(runner.cipherKeysForUser(data.vaultKeys, data.userPublicKeys))
        break
      case cmds.PASSWORD_CHANGE:
        self.postMessage(runner.passwordChange(data.password))
        break
      case cmds.SERIALIZE_AND_CLOSE:
        self.postMessage(runner.serializeAndClose(data.vaultKeys, data.obj))
        break
      case cmds.OPEN_AND_DESERIALIZE:
        self.postMessage(runner.openAndDeserialize(data.vaultKeys, data.data))
        break
      case cmds.OPEN_AND_DESERIALIZE_BULK:
        self.postMessage(runner.openAndDeserializeBulk(data.vsa))
        break
      case cmds.CLOSE_KEYS_WITH_PASSWORD:
        self.postMessage(await runner.closeKeysWithPassword(data.username, data.password))
        break
      default:
        self.postMessage({ error: 'Unknown command ' + data.cmd })
    }
  } catch (e) {
    console.log('Worker error. Stack:', e.stack)
    self.postMessage({ cmd: data.cmd, error: e.toString() })
  }
})
