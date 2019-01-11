<template>
  <div class="main card text-center">
    <div class="card-header bg-white">
      <ul class="nav nav-tabs card-header-tabs">
        <li class="nav-item">
          <a class="nav-link" :class="{active:this.active=='tab'}" href="#" @click="setActive('tab')" > 
            Tab 
            <span v-if="numberOfTabCredentials > 0" class="badge badge-dark" > {{ numberOfTabCredentials }} </span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{active:this.active=='search'}" href="#" @click="setActive('search')" >
            Search
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{active:this.active=='generator'}" href="#" @click="setActive('generator')" >
            Password generator
          </a>
        </li>
        <button type="button" class="btn btn-sm btn-outline-dark border-0 ml-auto" @click.prevent="logout" >
          Logout
        </button>
      </ul>
    </div>
    <div class="card-body p-0">
      <secret-list v-if="active=='tab'" :expand="true" :secrets="tabSecrets" />
      <search-tab v-if="active=='search'" />
      <generator-tab v-if="active=='generator'" />
    </div>
    <footer-nav class="p-1"></footer-nav>
  </div>
</template>

<script>
import SecretList from '@/popup/components/in/secret-list'
import SearchTab from '@/popup/components/in/search-tab'
import GeneratorTab from '@/popup/components/in/generator-tab'
import FooterNav from '@/popup/components/in/footer-nav'
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'logged-in',
  components: { SecretList, SearchTab, GeneratorTab, FooterNav },
  props: {
    tabSecrets: Array
  },
  data() {
    var d = {
      active: 'search'
    }
    if (this.tabSecrets.length > 0) {
      d.active = 'tab'
    }
    return d
  },
  computed: {
    numberOfTabCredentials() {
      var nc = 0
      this.tabSecrets.forEach(sec => {
        nc += sec.data._data.creds.length
      })
      return nc
    }
  },
  methods: {
    setActive(what) {
      this.active = what
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
.main {
  width: 450px;
  height: 500px;
}

.nav-link {
  color: #495057;
}
</style>
