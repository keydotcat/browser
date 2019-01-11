<template>
  <div class="top">
    <logged-in v-if="lin" :tab-secrets="secrets" />
    <not-logged-in v-if="lout" :tab-url="url" />
    <div
      v-if="checking"
      class="container loading d-flex justify-content-center align-items-center"
    >
      <i class="material-icons spinner">
        replay
      </i>
    </div>
  </div>
</template>

<script>
import NotLoggedIn from '@/popup/components/not-logged-in'
import LoggedIn from '@/popup/components/logged-in'
import Secret from '@/commonjs/secrets/secret'
import tabData from '@/popup/tab-data'
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'keycat-popup',
  components: { LoggedIn, NotLoggedIn },
  data() {
    return {
      loggedIn: false,
      checking: true,
      url: '',
      tab: {},
      secrets: []
    }
  },
  computed: {
    lin() {
      return this.loggedIn && !this.checking
    },
    lout() {
      return !this.loggedIn && !this.checking
    }
  },
  beforeMount() {
    msgBroker.sendToRuntimeAndGet({ cmd: 'popupOpen' }, msg => {
      this.loggedIn = msg.response.loggedIn
      this.checking = false
      this.url = msg.response.tab.url
      this.tab = msg.response.tab
      if (this.loggedIn) {
        this.secrets = msg.response.secrets.map(s => {
          return Secret.fromObject(s)
        })
      }
      tabData.loadData(msg.response.tab)
    })
  }
}
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
