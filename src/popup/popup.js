import Vue from 'vue';
import App from './App';
import store from '@/store';

import VuexWebExtensions from 'vuex-webextensions';
VuexWebExtensions({ persistentStates: ['kcPersistentStore'] })(store);

import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';

/*eslint-disable no-new */
new Vue({
  el: '#app',
  store,

  render: h => h(App),
});
