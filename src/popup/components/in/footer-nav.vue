<template>
    <footer class="p-1 bg-dark border-top d-flex justify-content-between">
      <button class="btn btn-sm d-flex" @click.prevent="openWui">
        <i class="material-icons">exit_to_app</i>
        Go to KeyCat
      </button>
      <!--span class="text-muted bg-light align-middle p-1 small">{{repoVersion}}</span-->
        <button type="button" class="btn btn-sm d-flex" @click.prevent="logout" >
        <i class="material-icons">open_in_new</i>
          Logout
        </button>
    </footer>
</template>

<script>
import browser from 'webextension-polyfill'
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'footer-nav',
  methods: {
    openWui() {
      browser.tabs
        .create({
          active: true,
          url: '/wui/wui.html'
        })
        .then(() => {
          window.close()
        })
    },
    logout() {
      msgBroker.sendToRuntimeAndGet({ cmd: 'logout' }, () => {
        window.close()
      })
    }
  }
}
</script>

<style scoped>
</style>
