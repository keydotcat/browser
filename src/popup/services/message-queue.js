import browser from 'webextension-polyfill';

class MessageQueue {
  constructor() {
    this.subs = [];
    browser.runtime.onMessage.addListener((r, s, c) => {
      return this.receiveMessage(r, s, c);
    });
  }
  sendMessageToTab(tabId, msg, opts) {
    browser.tabs.sendMessage(tabId, msg, opts);
  }
  receiveMessage(r, s, c) {
    console.log('received message', r, s, c);
    this.subs.forEach(cb => {
      cb(r, s, c);
    });
  }
  subscribe(cb) {
    this.subs.push(cb);
  }
  sendToRuntimeAndGet(msg, ftor) {
    this.subscribe(respMsg => {
      if (respMsg.cmd != msg.cmd + 'Response') {
        return;
      }
      ftor(respMsg.response);
    });
    browser.runtime.sendMessage(msg);
  }
}

export default new MessageQueue();
