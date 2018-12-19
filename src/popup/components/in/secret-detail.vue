<template>
  <div>
    {{secret.data.name}}
  </div>
</template>

<script>
export default {
  name: 'secret-detail',
  props: {
    secret: Object,
  },
};
</script>
