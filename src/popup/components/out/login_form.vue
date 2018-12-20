<template>
  <form>
    <p>Logging in to {{url}}</p>
    <div class="form-group">
      <label for="username">Username</label>
      <input v-model="uname" type="text" class="form-control" id="username" placeholder="Your username">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input v-model="pass" type="password" class="form-control" id="password">
    </div>
    <p v-if="errMsg=='errors.you_cannot_do_that'" class="alert alert-danger">Invalid creds</p>
    <p v-if="errMsg.length > 0 && errMsg!='errors.you_cannot_do_that'" class="alert alert-danger">{{errMsg}}</p>
    <button v-if="!working" type="submit" @click.prevent="submit" class="btn btn-primary w-auto">Sign in</button>
    <button v-if="working" type="submit" class="btn btn-primary w-auto" disabled>Signing in...</button>
  </form>
</template>

<script>
import browser from 'webextension-polyfill';

export default {
  name: 'login-form',
  props: {
    url: String,
  },
  data() {
    return {
      working: false,
      errMsg: '',
      uname: '',
      pass: '',
    };
  },
  methods: {
    async submit(ev) {
      ev.preventDefault();
      this.working = true;
      var self = this;
      this.errMsg = '';
      var resp = await browser.runtime.sendMessage({ cmd: 'login', url: this.url + '/api', user: this.uname, pass: this.pass });
      if ('error' in resp) {
        this.errMsg = resp.error;
        return;
      }
      window.close();
    },
  },
};
</script>
