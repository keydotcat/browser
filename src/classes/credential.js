import XoredData from '@/classes/xored_data'

export default class Credential {
  constructor(obj) {
    this.fromJson(obj || {})
  }
  set type(v){
    this._type = v
  }
  get type(){
    return this._type
  }
  set name(v){
    this._name = v
  }
  get name(){
    return this._name
  }
  set username(v){
    this._username = v
  }
  get username(){
    return this._username
  }
  set password(v) {
    this._password.fromString(v)
  }
  get password() {
    return this._password.toString()
  }
  cloneAsObject() {
    return {
      type: this._type,
      name: this._name,
      username: this._username,
      password: this._password.toString()
    }
  }
  fromJson(obj) {
    if(typeof obj === 'string'){
      obj = JSON.parse(obj)
    }
    var tp = 'password'
    switch(obj.type){
      case 'keys':
        tp = obj.type
    }
    this._type = tp
    this._name = obj.name || 'login'
    this._username = obj.username
    this._password = new XoredData(obj.password)
  }
}
