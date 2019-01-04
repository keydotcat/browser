<template>
  <form class="form-inline">
    <span class="mr-3">Do you want to add the credential to you KeyCat vault?</span>
    <div class="btn-group mr-3">
      <button class="btn btn-sm btn-outline-success" v-if="numVaults > 1" type="button" @click.prevent="prev()">&lt;</button>
      <button class="btn btn-sm btn-outline-success" type="button" @click.prevent="save()">Save credential to {{activeVault}}</button>
      <button class="btn btn-sm btn-outline-success" v-if="numVaults > 1" type="button" @click.prevent="next()">&gt;</button>
    </div>
    <button class="btn btn-sm btn-outline-secondary mr-3" @click.prevent="ignore" type="button">Ignore</button>
  </form>
</template>

<script>
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'add-msg',
  data() {
    return {
      vaults: [],
      vi: 0
    }
  },
  created() {
    var self = this
    msgBroker.sendToRuntimeAndGet({ cmd: 'bgGetVaults' }, resp => {
      self.vaults.splice(0, self.vaults.length)
      resp.data.forEach(v => {
        self.vaults.push(v)
      })
    })
  },
  computed: {
    activeVault() {
      if (this.vaults.length > 0) {
        return `${this.vaults[this.vi].teamName}/${this.vaults[this.vi].vid}`
      }
      return 'Loading vaults...'
    },
    numVaults() {
      return this.vaults.length
    }
  },
  methods: {
    next() {
      if (this.vaults.length > 0) {
        this.vi = (this.vi + 1) % this.vaults.length
      }
    },
    prev() {
      if (this.vaults.length > 0) {
        this.vi = (this.vi + this.vaults.length - 1) % this.vaults.length
      }
    },
    save() {
      this.$emit('send', { cmd: 'bgAddLoginYes', data: this.vaults[this.vi] })
    },
    ignore() {
      this.$emit('send', { cmd: 'bgNotificationClose' })
    }
  }
}
</script>
