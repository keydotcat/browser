<template>
    <div class="footer text-left d-flex justify-content-between">
      <button class="btn btn-sm d-flex" @click.prevent="openWui"><i class="material-icons">open_in_new</i>Go to KeyCat</button>
      <span class="text-muted p-1 small">{{repoVersion}}</span>
    </div>
</template>

<script>
import browser from 'webextension-polyfill'
import versions from '@/helper/version'

export default {
  name: 'footer-nav',
  methods: {
    openWui() {
      browser.tabs.create({
        active: true,
        url: 'wui/wui.html'
      })
    }
  },
  computed: {
    repoVersion() {
      return versions.repo
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
