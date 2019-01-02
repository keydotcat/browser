<template>
  <div>
    hello
  </div>
</template>

<script>
import msgBroker from '@/popup/services/msg-broker'

export default {
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
    msgBroker.sendToRuntimeAndGet({ cmd: 'barLoad' }, msg => {
      console.log('Got response for barLoad', msg)
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
