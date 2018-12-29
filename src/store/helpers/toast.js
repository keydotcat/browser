class ToastMgr {
  constructor() {
    this.okcb = this.noop
    this.errorcb = this.noop
  }
  noop(k, t) {
    console.log('Got not configured toast', k, t)
  }
  error(key, title = 'Error') {
    this.errorcb(key, title)
  }
  success(key, title = 'Success') {
    this.errorcb(key, title)
  }
}

var toastMgr = new ToastMgr()

export default toastMgr
