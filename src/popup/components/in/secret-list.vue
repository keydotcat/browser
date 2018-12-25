<template>
  <div>
    <p v-if="this.secrets.length==0">No credentials found</p>
    <ul class="list-group w-100">
      <li class="list-group-item p-0" v-for="secret in this.secrets">
        <secret-detail :expand="expand" :secret="secret"></secret-detail>
      </li>
    </ul>
  </div>
</template>

<script>
import SecretDetail from '@/popup/components/in/secret-detail';

export default {
  name: 'secret-list',
  components: { SecretDetail },
  props: {
    secrets: Array,
    expand: Boolean,
  },
  data() {
    return {};
  },
};
</script>
