<template>
  <div class='top'>
    <logged-in v-if="$store.getters['session/loggedIn']"></logged-in>
    <not-logged-in v-if="!$store.getters['session/loggedIn']"></not-logged-in>
  </div>
</template>

<script>
import NotLoggedIn from '@/popup/components/not-logged-in';
import LoggedIn from '@/popup/components/logged-in';

export default {
  data() {
    return {};
  },
  components: { LoggedIn, NotLoggedIn },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Lato');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import '~bootstrap/scss/bootstrap.scss';

html,
body {
  font-family: 'Lato';
}
</style>
