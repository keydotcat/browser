<template>
  <div>
    <div class="p-1">
      <div class="input-group mb-1">
        <input v-model="searchName" type="text" class="form-control" placeholder="Search" @keyup="doSearch"/>
        <div class="input-group-append">
          <i class="material-icons input-group-text"> search </i>
        </div>
      </div>
    </div>
    <secret-list :expand="false" class="secret-list" :secrets="secrets"/>
  </div>
</template>

<script>
import SecretList from '@/popup/components/in/secret-list'
import Secret from '@/commonjs/secrets/secret'
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'seach-tab',
  components: { SecretList },
  data() {
    return {
      searchName: '',
      secrets: []
    }
  },
  beforeMount() {
    this.doSearch()
  },
  methods: {
    doSearch() {
      msgBroker.sendToRuntimeAndGet({ cmd: 'popupSearch', name: this.searchName }, msg => {
        this.secrets = msg.response.map(s => {
          return Secret.fromObject(s)
        })
      })
    }
  }
}
</script>

<style scoped>
.secret-list {
  overflow: auto;
  height: 350px;
}
</style>
