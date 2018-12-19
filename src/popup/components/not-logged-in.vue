<template>
  <div class='notloggedin'>
    <div v-if="checking" class='container loading d-flex justify-content-center align-items-center'>
      <i class="material-icons spinner">replay</i>
    </div>
    <div v-if="!checking" class='container loaded d-flex justify-content-center align-items-center'>
      <login-form v-if="isKeyCat" :url="url"></login-form>
      <not-key-cat v-if="!isKeyCat"></not-key-cat>
    </div>
  </div>
</template>

<script>
import discoverSvc from '@/popup/services/discover';
import NotKeyCat from '@/popup/components/out/not_key_cat';
import LoginForm from '@/popup/components/out/login_form';

function getTabs(ftor) {
  if (chrome) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      ftor(tabs);
    });
  } else {
    browser.tabs.query({ active: true, currentWindow: true }).then(ftor);
  }
}

export default {
  name: 'not-logged-in',
  components: { NotKeyCat, LoginForm },
  data() {
    return {
      alive: true,
      checking: true,
      isKeyCat: true,
      url: '',
      version: {
        server: '',
        web: '',
      },
    };
  },
  beforeDestroy() {
    this.alive = false;
  },
  beforeMount() {
    var self = this;
    setTimeout(() => {
      if (!self.alive) {
        return;
      }
      getTabs(function(tabs) {
        if (tabs.length == 0) {
          return;
        }
        var urlObj = new URL(tabs[0].url);
        self.url = urlObj.origin;
        discoverSvc
          .isKeyCat(self.url)
          .then(version => {
            self.checking = false;
            self.isKeyCat = true;
            self.version.server = version.server;
            self.version.web = version.web;
          })
          .catch(err => {
            self.checking = false;
            self.isKeyCat = false;
          });
      });
    }, 500);
  },
};
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
