import browser from 'webextension-polyfill';
import { BrowserApi } from '@/helper/browser-api';
import BrowserEventMgr from '@/background/browser-events';

import store from '@/store';
import VuexWebExtensions from 'vuex-webextensions';
import IconMgr from '@/background/icon';

var iconMgr = new IconMgr();
iconMgr.setOffIcon();

VuexWebExtensions()(store);
iconMgr.subscribeToStore(store);

store.dispatch('session/loadFromStorage');

var browserEvents = new BrowserEventMgr(store, iconMgr);
browserEvents.subscribe();
