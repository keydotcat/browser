<template>
  <form>
    <div class="alert alert-danger" v-if="errMsg.length > 0" role="alert">{{errMsg}}</div>
    <p>Logging in to {{url}}</p>
    <div class="form-group">
      <label for="username">Username</label>
      <input v-model="uname" type="text" class="form-control" id="username" placeholder="Your username">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input v-model="pass" type="password" class="form-control" id="password">
    </div>
    <button type="submit" @click="submit" class="btn btn-primary w-auto">Sign in</button>
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
    submit(ev) {
      ev.preventDefault();
      this.working = true;
      var self = this;
      this.errMsg = '';
      return browser.runtime
        .sendMessage({ cmd: 'login', url: this.url + '/api', user: this.uname, pass: this.pass })
        .then(resp => {
          console.log('LOOLJ', resp);
        })
        .catch(err => {
          console.log('ERRoOR', err, Object.keys(err));
        });
    },
  },
};
</script>
