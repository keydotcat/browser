<template>
  <div class="main card text-center">
    <div class="card-header bg-white">
      <ul class="nav nav-tabs card-header-tabs">
        <li class="nav-item">
          <a class="nav-link" @click="setActive('found')" :class="{active:this.active=='found'}" href="#">
            Found <span class="badge badge-dark" v-if="numberOfCredentials > 0">{{numberOfCredentials}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" @click="setActive('search')" :class="{active:this.active=='search'}" href="#">Search</a>
        </li>
        <button type="button" class='btn btn-sm btn-outline-dark border-0 ml-auto'>Logout</button>
      </ul>
    </div>
    <div class="card-body p-0">
      <secret-list :secrets="foundSecrets"></secret-list>
    </div>
  </div>
</template>

<script>
import { BrowserApi } from '@/helper/browser-api';
import SecretList from '@/popup/components/in/secret-list';
import Secret from '@/commonjs/secrets/secret';

export default {
  name: 'logged-in',
  components: { SecretList },
  data() {
    return {
      active: 'search',
      url: '',
    };
  },
  beforeMount() {
    BrowserApi.getTabFromCurrentWindow().then(ctab => {
      this.url = ctab.url;
    });
  },
  methods: {
    setActive(what) {
      this.active = what;
    },
  },
  computed: {
    foundSecrets() {
      if (this.url.length === 0) {
        return [];
      }
      return this.$store.getters['secrets/forUrl'](this.url).map(v => {
        return Secret.fromObject(v);
      });
    },
    numberOfCredentials() {
      var nc = 0;
      this.foundSecrets.forEach(sec => {
        console.log(sec);
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
