<template>
  <div class="text-left pl-1">
    <div class="row">
      <div class="col font-weight-bold d-flex" @click="expanded=!expanded">
        <i v-if="!expanded" class="material-icons mt-auto mb-auto">chevron_right</i>
        <i v-if="expanded" class="material-icons mt-auto mb-auto">expand_more</i>
        <p class="m-0">{{secret.data.name}}</p>
      </div>
    </div>
    <div class="pl-2" v-if="expanded">
      <p class="text-muted m-1">Credentials</p>
      <div class="row pl-3" v-for="cred in secret.data.creds">
        <div class="col-1">
          <i class="material-icons mt-auto mb-auto">exit_to_app</i>
        </div>
        <div class="col-11">
          {{cred.name}}: {{cred.username}}
        </div>
      </div>
      <p class="text-muted m-1">URLs</p>
      <div class="row pl-3" v-for="url in secret.data.urls">
        <div class="col-1 text-right">
          <a class="text-muted" :href="url" target="_blank"><i class="material-icons mt-auto mb-auto">open_in_new</i> </a>
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
    expand: Boolean,
  },
  data() {
    console.log('Auto', this.expand);
    return {
      expanded: this.expand ? true : false,
    };
  },
};
</script>
