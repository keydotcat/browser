const LS_KEYCAT_EXTENSION_SESSION_DATA = 'kcExtSessionData'

export default {
  storeLocalState(payload){
    localStorage.setItem(LS_KEYCAT_EXTENSION_SESSION_DATA, JSON.stringify(payload))
  },
  loadLocalState(){
    return JSON.parse(localStorage.getItem(LS_KEYCAT_EXTENSION_SESSION_DATA))
  }
}
