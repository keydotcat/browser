<template>
    <div class="footer text-left">
      <button class="btn btn-sm" @click.prevent="openWui"><i class="material-icons">open_in_new</i>Go to KeyCat</button>
    </div>
</template>

<script>
import browser from 'webextension-polyfill'

export default {
  name: 'footer-nav',
  methods: {
    openWui() {
      browser.tabs.create({
        active: true,
        url: 'wui/wui.html'
      })
    }
  }
}
</script>

<style scoped>
.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
}
</style>
