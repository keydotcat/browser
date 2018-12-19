<template>
  <div class="text-left pl-1">
    <div class="row">
      <div class="col font-weight-bold">
        {{secret.data.name}}
      </div>
    </div>
    <div class="pl-2" v-if="expanded">
      <p class="text-muted m-1">Credentials</p>
      <div class="row pl-3" v-for="cred in secret.data.creds">
        <div class="col-1">
          i
        </div>
        <div class="col-11">
          {{cred.name}}: {{cred.username}}
        </div>
      </div>
      <p class="text-muted m-1">URLs</p>
      <div class="row pl-3" v-for="url in secret.data.urls">
        <div class="col-1">
         i 
        </div>
        <div class="col-11">
          {{url}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'secret-detail',
  props: {
    secret: Object,
  },
  data() {
    return {
      expanded: true,
    };
  },
};
</script>
