import { BrowserApi } from '@/helper/browser-api'
import UrlParse from '@/commonjs/helpers/urlparse'

export default class NotificationQueue {
  constructor() {
    this.queue = []
    this.cleanup()
  }
  add(notification) {
    this.queue.push(notification)
  }
  removeTab(tab) {
    var i = 0
    while (i < this.queue.length) {
      if (this.queue[i].tabId === tab.id) {
        this.queue.splice(i, 1)
      } else {
        i++
      }
    }
  }
  cleanup() {
    var i = 0
    var now = new Date()
    while (i < this.queue.length) {
      if (this.queue[i].expires < now) {
        this.queue.splice(i, 1)
      } else {
        i++
      }
    }
    setTimeout(() => this.cleanup(), 2 * 60 * 1000) // check every 2 minutes
  }
  async check(tab) {
    if (tab == null) {
      tab = await BrowserApi.getTabFromCurrentWindow()
    }
    if (tab == null) {
      return
    }
    const tabDomain = UrlParse.getDomain(tab.url)
    if (tabDomain == null) {
      return
    }

    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].tabId !== tab.id || this.queue[i].domain !== tabDomain) {
        continue
      }
      if (this.queue[i].type === 'addLogin') {
        BrowserApi.tabSendMessageData(tab, 'openNotificationBar', {
          type: 'add'
        })
      } else if (this.queue[i].type === 'changePassword') {
        BrowserApi.tabSendMessageData(tab, 'openNotificationBar', {
          type: 'change'
        })
      }
      break
    }
  }
  runWith(tab, nType, ftor) {
    var i = 0
    while (i < this.queue.length) {
      var notif = this.queue[i]
      if (notif.tabId !== tab.id || notif.type !== nType) {
        i++
        continue
      }

      const tabDomain = UrlParse.getDomain(tab.url)
      if (tabDomain != null && tabDomain !== notif.domain) {
        i++
        continue
      }

      this.queue.splice(i, 1)
      ftor(notif)
    }
  }
}
