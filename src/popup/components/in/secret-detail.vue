<template>
  <div class="text-left pl-1">
    <div class="font-weight-bold h5 d-flex m-0 p-0" @click="expanded = !expanded">
      <i v-if="!expanded" class="material-icons mt-auto mb-auto">chevron_right</i>
      <i v-if="expanded" class="material-icons mt-auto mb-auto">expand_more</i>
      <p class="m-1">
        {{ secret.data.name }}
      </p>
    </div>
    <div v-if="expanded" class="pl-2">
      <p class="text-muted m-1">
        Credentials
      </p>
      <div v-for="cred in secret.data.creds" class="row m-0 pl-3">
        <button class="btn btn-sm btn-outline-dark p-0 border-0 col-1 pointme" @click="fillWithCred(cred)">
          <i class="material-icons mt-auto mb-auto"> open_in_browser </i>
        </button>
        <div class="col-11">
          {{ cred.name }}: {{ cred.username }}
          <copy-button class="btn btn-sm btn-outline-secondary ml-1 p-0 border-0" :copy="cred.username"><i class="material-icons">account_circle</i></copy-button>
          <copy-button class="btn btn-sm btn-outline-secondary ml-1 p-0 border-0" :copy="cred.password.toString()"><i class="material-icons">vpn_key</i></copy-button>
        </div>
      </div>
      <p v-if="secret.data.urls.length > 0" class="text-muted m-1">URLs</p>
      <div v-for="url in secret.data.urls" class="row m-0 pl-3">
        <div class="col-1 text-right">
          <a class="text-muted" href="#" @click="openUrl(url)">
            <i class="material-icons mt-auto mb-auto">
              open_in_new
            </i>
          </a>
        </div>
        <div class="col-11">
          {{ url }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import browser from 'webextension-polyfill'
import tabData from '@/popup/tab-data'
import CopyButton from '@/popup/components/in/copy-button'

export default {
  name: 'SecretDetail',
  components: { CopyButton },
  props: {
    secret: Object,
    expand: Boolean
  },
  data() {
    return {
      expanded: !!this.expand
    }
  },
  methods: {
    fillWithCred(cred) {
      tabData.fillWithCred(cred)
    },
    openUrl(url) {
      browser.tabs
        .create({
          active: true,
          url: url
        })
        .then(() => {
          window.close()
        })
    }
  }
}
</script>

<style>
.pointme {
  cursor: pointer;
}
</style>
