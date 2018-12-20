<template>
  <div class='top'>
    <logged-in :tabSecrets="secrets" v-if="lin"></logged-in>
    <not-logged-in :tabUrl="this.url" v-if="lout"></not-logged-in>
    <div v-if="checking" class='container loading d-flex justify-content-center align-items-center'>
      <i class="material-icons spinner">replay</i>
    </div>
  </div>
</template>

<script>
import NotLoggedIn from '@/popup/components/not-logged-in';
import LoggedIn from '@/popup/components/logged-in';
import browser from 'webextension-polyfill';
import Secret from '@/commonjs/secrets/secret';
import tabData from '@/popup/tab-data';

export default {
  data() {
    return {
      loggedIn: false,
      checking: true,
      url: '',
      tab: {},
      secrets: [],
    };
  },
  components: { LoggedIn, NotLoggedIn },
  async beforeMount() {
    var res = await browser.runtime.sendMessage({ cmd: 'popupOpen' });
    this.loggedIn = res.loggedIn;
    this.checking = false;
    this.url = res.tab.url;
    this.tab = res.tab;
    if (this.loggedIn) {
      this.secrets = res.secrets.map(s => {
        return Secret.fromObject(s);
      });
    }
    tabData.loadData(res.tab);
  },
  computed: {
    lin() {
      return this.loggedIn && !this.checking;
    },
    lout() {
      return !this.loggedIn && !this.checking;
    },
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Lato');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import '~bootstrap/scss/bootstrap.scss';

html,
body {
  font-family: 'Lato';
}

.loading {
  width: 75px;
  height: 75px;
}

.spinner {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
