import browser from 'webextension-polyfill'

class MessageBroker {
  constructor() {
    this.subs = []
    this.waits = {}
    browser.runtime.onMessage.addListener((r, s, c) => {
      return this.receiveMessage(r, s, c)
    })
  }
  sendMessageToTab(tabId, msg, opts) {
    browser.tabs.sendMessage(tabId, msg, opts)
  }
  receiveMessage(msg, sender, c) {
    this.subs.forEach(cb => {
      cb(msg, sender, c)
    })
    if (msg.cmd in this.waits) {
      for (var i = 0; i < this.waits[msg.cmd].length; i++) {
        this.waits[msg.cmd][i](msg, sender)
      }
      this.waits[msg.cmd] = []
    }
  }
  subscribe(cb) {
    this.subs.push(cb)
  }
  sendToRuntimeAndGet(msg, ftor) {
    var cmdKey = msg.cmd + 'Response'
    if (!(cmdKey in this.waits)) {
      this.waits[cmdKey] = []
    }
    this.waits[cmdKey].push(ftor)
    browser.runtime.sendMessage(msg)
  }
}

export default new MessageBroker()
