<template>
  <form class="form-inline">
    <span class="mr-3">Do you want to replace the password for this credential?</span>
    <button class="btn btn-sm btn-outline-success mr-3" type="button" @click.prevent="save()">Replace password</button>
    <button class="btn btn-sm btn-outline-secondary mr-3" @click.prevent="keep" type="button">Keep old credential</button>
    <!--button class="btn btn-sm btn-outline-secondary mr-3" @click.prevent="ignore" type="button">Ignore</button-->
  </form>
</template>

<script>
import msgBroker from '@/popup/services/msg-broker'

export default {
  name: 'change-pass-msg',
  data() {
    return {}
  },
  computed: {},
  methods: {
    save() {
      this.$emit('send', { cmd: 'bgChangePasswordYes' })
    },
    keep() {
      this.$emit('send', { cmd: 'bgNotificationClose' })
    },
    ignore() {
      this.$emit('send', { cmd: 'bgChangePasswordIgnore' })
    }
  }
}
</script>
