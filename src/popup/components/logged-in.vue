<template>
  <div class="main card text-center">
    <div class="card-header bg-white">
      <ul class="nav nav-tabs card-header-tabs">
        <li class="nav-item">
          <a class="nav-link" @click="setActive('tab')" :class="{active:this.active=='tab'}" href="#">
            Tab <span class="badge badge-dark" v-if="numberOfTabCredentials > 0">{{numberOfTabCredentials}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" @click="setActive('search')" :class="{active:this.active=='search'}" href="#">Search</a>
        </li>
        <button type="button" @click.prevent="logout" class='btn btn-sm btn-outline-dark border-0 ml-auto'>Logout</button>
      </ul>
    </div>
    <div class="card-body p-0">
      <secret-list v-if="active=='tab'" :expand="true" :secrets="tabSecrets"></secret-list>
      <search-tab v-if="active=='search'"></search-tab>
    </div>
  </div>
</template>

<script>
import { BrowserApi } from '@/helper/browser-api';
import SecretList from '@/popup/components/in/secret-list';
import SearchTab from '@/popup/components/in/search-tab';
import Secret from '@/commonjs/secrets/secret';
import browser from 'webextension-polyfill';
import msgBroker from '@/popup/services/msg-broker';

export default {
  name: 'logged-in',
  components: { SecretList, SearchTab },
  props: {
    tabSecrets: Array,
  },
  data() {
    var d = {
      active: 'search',
    };
    if (this.tabSecrets.length > 0) {
      d.active = 'tab';
    }
    return d;
  },
  methods: {
    setActive(what) {
      this.active = what;
    },
    logout() {
      msgBroker.sendToRuntimeAndGet({ cmd: 'logout' }, () => {
        window.close();
      });
    },
  },
  computed: {
    numberOfTabCredentials() {
      var nc = 0;
      this.tabSecrets.forEach(sec => {
        nc += sec.data._data.creds.length;
      });
      return nc;
    },
  },
};
</script>

<style scoped>
.main {
  width: 400px;
  height: 500px;
}

.nav-link {
  color: #495057;
}
</style>
