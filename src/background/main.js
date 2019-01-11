import BrowserEventMgr from '@/background/browser-events'

import KeyMgr from '@/commonjs/store/helpers/keymgrwrap'
import LocalKeyMgr from '@/commonjs/store/helpers/local-keymgr'

import store from '@/commonjs/store'
import IconMgr from '@/background/icon'

KeyMgr.setInner(LocalKeyMgr)

var iconMgr = new IconMgr()
iconMgr.setOffIcon()

iconMgr.subscribeToStore(store)

store.dispatch('session/loadFromExtensionStorage')

var browserEvents = new BrowserEventMgr(store, iconMgr)
browserEvents.subscribe()
