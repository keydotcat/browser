<template>
  <div class='topContainer'>
    <not-logged-in v-if="!loggedIn"></not-logged-in>
  </div>
</template>

<script>
import NotLoggedIn from '@/popup/components/not_logged_in';
import sessionMgr from '@/background/session';

export default {
  data() {
    return {};
  },
  components: { NotLoggedIn },
  computed: {
    loggedIn() {
      return sessionMgr.loggedIn();
    },
  },
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
