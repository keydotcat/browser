import { BrowserApi } from '@/helper/browser-api'
import UrlParse from '@/commonjs/helpers/urlparse'

export default class NotificationQueue {
  constructor() {
    this.queue = []
  }
  add(notification) {
    this.queue.push(notification)
  }
  removeTab(tab) {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].tabId === tab.id) {
        this.queue.splice(i, 1)
      }
    }
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
