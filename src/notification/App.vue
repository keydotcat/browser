<template>
  <nav class="navbar navbar-light bg-light p-0">
    <a class="navbar-brand" href="#">
      <logo-icon class="pl-1"></logo-icon>
    </a>
    <add-msg v-if="action == 'add'" v-on:send="doSend"></add-msg>
    <change-pass-msg v-if="action == 'change'" v-on:send="doSend"></change-pass-msg>
  </nav>
</template>

<script>
import msgBroker from '@/popup/services/msg-broker'
import LogoIcon from '@/notification/components/icon'
import AddMsg from '@/notification/components/add-msg'
import ChangePassMsg from '@/notification/components/change-pass-msg'

function getQueryVariable(variable) {
  var query = window.location.search.substring(1)
  var vars = query.split('&')

  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
    if (pair[0] === variable) {
      return pair[1]
    }
  }

  return null
}

export default {
  components: { LogoIcon, AddMsg, ChangePassMsg },
  data() {
    return {
      url: '',
      action: ''
    }
  },
  beforeMount() {
    this.action = getQueryVariable('action')
  },
  methods: {
    doSend(msg) {
      msgBroker.sendToRuntime(msg)
    }
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
