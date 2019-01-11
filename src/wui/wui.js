import i18n from '@/commonjs/wui/i18n'
import KeyMgr from '@/commonjs/store/helpers/keymgrwrap'
import LocalKeyMgr from '@/commonjs/store/helpers/local-keymgr'
import store from '@/commonjs/store'

import Vue from 'vue'
import wuiapp from './wui-app'

//Auto toast errors
import axios from 'axios'
import AutoToastSvc from '@/commonjs/wui/services/autotoast'

axios.interceptors.response.use(
  function(response) {
    return response
  },
  function(err) {
    AutoToastSvc.toastAxiosError(err)
    return Promise.reject(err)
  }
)

//JS Libs used for bootstrap
import 'jquery/dist/jquery.min.js'
import 'popper.js/dist/umd/popper.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'

//Use local keymanager
//TODO: Use webworkers here
KeyMgr.setInner(LocalKeyMgr)

//Load from storage if any
store.dispatch('session/loadFromExtensionStorage')

//Run the wui
/*eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  i18n,
  render: h => h(wuiapp)
})
