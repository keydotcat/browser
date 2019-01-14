<template>
  <div class="text-left pl-1">
    <div class="row m-0">
      <div class="col font-weight-bold d-flex p-0" @click="expanded=!expanded">
        <i v-if="!expanded" class="material-icons mt-auto mb-auto">chevron_right</i>
        <i v-if="expanded" class="material-icons mt-auto mb-auto">expand_more</i>
        <p class="m-1">
          {{ secret.data.name }}
        </p>
      </div>
    </div>
    <div v-if="expanded" class="pl-2" >
      <p class="text-muted m-1">
        Credentials
      </p>
      <div v-for="cred in secret.data.creds" class="row m-0 pl-3" >
        <div class="col-1 pointme" @click="fillWithCred(cred)" >
          <i class="material-icons mt-auto mb-auto"> open_in_browser </i>
        </div>
        <div class="col-11">
          {{ cred.name }}: {{ cred.username }}
        </div>
      </div>
      <p v-if="secret.data.urls.length > 0" class="text-muted m-1" >URLs</p>
      <div v-for="url in secret.data.urls" class="row m-0 pl-3" >
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

export default {
  name: 'SecretDetail',
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
