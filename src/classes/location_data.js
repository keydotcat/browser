import Credential from '@/classes/credential'
import $ from 'jquery'

export default class LocationData {
  constructor(obj) {
    this._data = {
      type: 'location',
      name: '',
      urls: [],
      creds: [],
      note: '',
      labels: []
    }
    if(obj){
      this.fromJson(obj)
    }
  }
  get type(){
    return this._data.type
  }
  set name(v){
    this._data.name = v
  }
  get name(){
    return this._data.name
  }
  set note(v){
    this._data.note = v
  }
  get note(){
    return this._data.note
  }
  get urls() {
    return this._data.urls
  }
  get creds() {
    return this._data.creds
  }
  get labels() {
    return this._data.labels
  }
  fromJson(obj) {
    if(typeof obj === 'string'){
      obj = JSON.parse(obj)
    }
    if(obj.type !== 'location'){
      throw new Error('Invalid object type ' + obj.type)
    }
    this._data.name = obj.name || []
    this._data.urls = obj.urls || []
    this._data.labels = obj.labels || []
    this._data.note = obj.note || ''
    this._data.creds = []
    var sourceCreds = obj.creds || []
    sourceCreds.forEach( cred => {
      this._data.creds.push(new Credential(cred))
    })
  }
  cloneAsObject() {
    var c = $.extend(true, {}, this._data)
    for(var i = 0; i < this._data.creds.length; i++){
      c.creds[i] = this._data.creds[i].cloneAsObject()
    }
    return c
  }
}
