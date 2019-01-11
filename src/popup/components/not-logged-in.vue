<template>
  <div class="notloggedin">
    <div v-if="checking" class="container loading d-flex justify-content-center align-items-center" >
      <i class="material-icons spinner">
        replay
      </i>
    </div>
    <div v-if="!checking" class="container loaded d-flex justify-content-center align-items-center" >
      <login-form v-if="isKeyCat" :url="url" />
      <not-keycat v-if="!isKeyCat" />
    </div>
  </div>
</template>

<script>
import discoverSvc from '@/popup/services/discover'
import NotKeyCat from '@/popup/components/out/not-keycat'
import LoginForm from '@/popup/components/out/login-form'

export default {
  name: 'not-logged-in',
  components: { NotKeyCat, LoginForm },
  props: {
    tabUrl: String
  },
  data() {
    return {
      checking: true,
      isKeyCat: true,
      url: '',
      version: {
        server: '',
        web: ''
      }
    }
  },
  beforeDestroy() {
    this.alive = false
  },
  beforeMount() {
    var urlObj = new URL(this.tabUrl)
    this.url = urlObj.origin
    discoverSvc
      .isKeyCat(this.url)
      .then(version => {
        this.checking = false
        this.isKeyCat = true
        this.version.server = version.server
        this.version.web = version.web
      })
      .catch(() => {
        this.checking = false
        this.isKeyCat = false
      })
  }
}
</script>

<style lang="scss" scoped>
.loaded {
  padding: 20px;
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
