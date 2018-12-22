<template>
  <div>
    <div class="p-1">
      <div class="input-group mb-1">
        <input type="text" v-model="searchName" @keyup="doSearch" class="form-control" placeholder="Search">
        <div class="input-group-append">
          <i class="material-icons input-group-text">search</i>
        </div>
      </div>
    </div>
    <secret-list :expand="false" :secrets="secrets"></secret-list>
  </div>
</template>

<script>
import SecretList from '@/popup/components/in/secret-list';
import browser from 'webextension-polyfill';
import Secret from '@/commonjs/secrets/secret';
import msgBroker from '@/popup/services/msg-broker';

export default {
  name: 'seach-tab',
  components: { SecretList },
  data() {
    return {
      searchName: '',
      secrets: [],
    };
  },
  beforeMount() {
    this.doSearch();
  },
  methods: {
    doSearch() {
      console.log('rear');
      msgBroker.sendToRuntimeAndGet({ cmd: 'popupSearch', name: this.searchName }, msg => {
        console.log('rear res', msg);
        this.secrets = msg.response.map(s => {
          return Secret.fromObject(s);
        });
      });
    },
  },
};
</script>
