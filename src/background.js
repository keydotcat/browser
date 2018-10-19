import KeyMgr from '@/commonjs/crypto/key_mgr';
import browser from 'webextension-polyfill'

class BackgroundMgr {
  constructor() {
    this.keyMgr = new KeyMgr()
  }
}

mgr = new BackgroundMgr()

function hashLoginPassword(u,p){
  console.log('got here')
  return mgr.keyMgr.hashLoginPassword(u,p)
}
