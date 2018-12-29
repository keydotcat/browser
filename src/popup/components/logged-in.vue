<template>
  <div class="main card text-center">
    <div class="card-header bg-white">
      <ul class="nav nav-tabs card-header-tabs">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{active:this.active=='tab'}"
            href="#"
            @click="setActive('tab')"
          >
            Tab <span
              v-if="numberOfTabCredentials > 0"
              class="badge badge-dark"
            >
              {{ numberOfTabCredentials }}
            </span>
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{active:this.active=='search'}"
            href="#"
            @click="setActive('search')"
          >
            Search
          </a>
        </li>
        <button
          type="button"
          class="btn btn-sm btn-outline-dark border-0 ml-auto"
          @click.prevent="logout"
        >
          Logout
        </button>
      </ul>
    </div>
    <div class="card-body p-0">
      <SecretList
        v-if="active=='tab'"
        :expand="true"
        :secrets="tabSecrets"
      />
      <SearchTab v-if="active=='search'" />
    </div>
  </div>
</template>

<script>
import SecretList from '@/popup/components/in/secret-list'
import SearchTab from '@/popup/components/in/search-tab'
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'LoggedIn',
  components: { SecretList, SearchTab },
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
  width: 400px;
  height: 500px;
}

.nav-link {
  color: #495057;
}
</style>
