import Vue from 'vue'
import Vuex from 'vuex'

import modules from './modules'
import plugins from './plugins'

Vue.use(Vuex)

export default new Vuex.Store({
  modules,
  plugins,
  strict: process.env.NODE_ENV !== 'production'
})
