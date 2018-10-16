import util from 'tweetnacl-util'

function getRandomArray(len) {
  const crypto = window.crypto || window.msCrypto
  const randomValues = new Uint8Array(len)
  crypto.getRandomValues(randomValues)
  return randomValues
}

export default class XoredData {
  constructor(data) {
    if(typeof data === 'string'){
      this.fromString(data)
    } else if(data instanceof Uint8Array) {
      this.fromBinary(data)
    } else {
      throw new Error('Expected either string of Uint8Array')
    }
  }
  fromBinary(bytes) {
    this.__data = new Uint8Array(bytes.length)
    this.__xor = getRandomArray(bytes.length)
    for (var i = 0, len = bytes.length; i < len; i++) {
      this.__data[i] = bytes[i] ^ this.__xor[i]
    }
  }
  fromString(msg) {
    this.fromBinary(util.decodeUTF8(msg))
  }
  toBinary() {
    var bytes = new Uint8Array(this.__data.length)
    for (var i = 0, len = bytes.length; i < len; i++) {
      bytes[i] = this.__data[i] ^ this.__xor[i]
    }
    return bytes
  }
  toString() {
    return util.encodeUTF8(this.toBinary())
  }
}
