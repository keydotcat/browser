<template>
  <div>
    <p v-if="this.secrets.length==0">
      No credentials found
    </p>
    <ul class="list-group w-100">
      <li
        v-for="secret in this.secrets"
        class="list-group-item p-0"
      >
        <SecretDetail
          :expand="expand"
          :secret="secret"
        />
      </li>
    </ul>
  </div>
</template>

<script>
import SecretDetail from '@/popup/components/in/secret-detail'

export default {
  name: 'secret-list',
  components: { SecretDetail },
  props: {
    secrets: Array,
    expand: Boolean
  },
  data() {
    return {}
  }
}
</script>
