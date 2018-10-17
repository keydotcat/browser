<template>
  <form>
    <p>Logging in to {{url}}</p>
    <div class="form-group">
      <label for="username">Username</label>
      <input v-model="uname" type="text" class="form-control" id="username" placeholder="Your username">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input v-model="password" type="password" class="form-control" id="password">
    </div>
    <button type="submit" @click="submit" class="btn btn-primary w-auto">Sign in</button>
  </form>
</template>

<script>
export default {
  name: 'login-form',
  props: {
    url: String
  },
  data() {
    return {
      uname: '',
      password: ''
    }
  },
  methods: {
    submit(ev) {
      ev.preventDefault()
      console.log('Ckil')
    }
  }
}
</script>
