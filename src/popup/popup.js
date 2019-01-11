import Vue from 'vue'
import PopupApp from './popup-app'

import 'jquery/dist/jquery.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'

/*eslint-disable no-new */
new Vue({
  el: '#app',

  render: h => h(PopupApp)
})
