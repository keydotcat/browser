import * as mt from '@/commonjs/store/mutation-types'
import browser from 'webextension-polyfill'

export default class IconMgr {
  setOffIcon() {
    this.setIcon('-off')
  }

  setOnIcon() {
    this.setIcon('-on')
  }

  setIcon(suffix) {
    var options = {
      path: {
        '48': `icons/icon_48${suffix}.png`,
        '128': `icons/icon_128${suffix}.png`
      }
    }
    browser.browserAction.setIcon(options)
  }

  setNumberOfEntries(tabId, numCreds) {
    browser.browserAction.setBadgeBackgroundColor({ color: '#234' })
    var txt = ''
    if (numCreds > 0) {
      txt = numCreds.toString()
    }
    browser.browserAction.setBadgeText({ text: txt, tabId: tabId })
  }

  subscribeToStore(store) {
    store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'session/' + mt.SESSION_LOGIN:
        case 'session/' + mt.SESSION_EXISTS:
          this.setIcon('-on')
          break
        case 'session/' + mt.SESSION_LOGOUT:
          this.setOffIcon()
          break
      }
    })
  }
}
