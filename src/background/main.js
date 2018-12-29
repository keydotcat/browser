import BrowserEventMgr from '@/background/browser-events'

import KeyMgr from '@/commonjs/store/helpers/keymgrwrap'
import LocalKeyMgr from '@/commonjs/store/helpers/local-keymgr'

import store from '@/commonjs/store'
import VuexWebExtensions from 'vuex-webextensions'
import IconMgr from '@/background/icon'

KeyMgr.setInner(LocalKeyMgr)

var iconMgr = new IconMgr()
iconMgr.setOffIcon()

VuexWebExtensions()(store)
iconMgr.subscribeToStore(store)

store.dispatch('session/loadFromStorage')

var browserEvents = new BrowserEventMgr(store, iconMgr)
browserEvents.subscribe()
