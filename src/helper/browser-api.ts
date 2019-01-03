export class BrowserApi {
  static isWebExtensionsApi: boolean = typeof browser !== 'undefined'
  static isSafariApi: boolean = typeof safari !== 'undefined' && navigator.userAgent.indexOf(' Safari/') !== -1 && navigator.userAgent.indexOf('Chrome') === -1
  static isChromeApi: boolean = !BrowserApi.isSafariApi && typeof chrome !== 'undefined'
  static isFirefoxOnAndroid: boolean = navigator.userAgent.indexOf('Firefox/') !== -1 && navigator.userAgent.indexOf('Android') !== -1
  static isEdge18: boolean = navigator.userAgent.indexOf(' Edge/18.') !== -1

  static async getTabFromCurrentWindowId(): Promise<any> {
    if (BrowserApi.isChromeApi) {
      return await BrowserApi.tabsQueryFirst({
        active: true,
        windowId: chrome.windows.WINDOW_ID_CURRENT
      })
    } else if (BrowserApi.isSafariApi) {
      return await BrowserApi.getTabFromCurrentWindow()
    }
  }

  static async getTabFromCurrentWindow(): Promise<any> {
    return await BrowserApi.tabsQueryFirst({
      active: true,
      currentWindow: true
    })
  }

  static async getActiveTabs(): Promise<any[]> {
    return await BrowserApi.tabsQuery({
      active: true
    })
  }

  static tabsQuery(options: any): Promise<any[]> {
    if (BrowserApi.isChromeApi) {
      return new Promise(resolve => {
        chrome.tabs.query(options, (tabs: any[]) => {
          resolve(tabs)
        })
      })
    } else if (BrowserApi.isSafariApi) {
      let wins: any[] = []
      if (options.currentWindow) {
        if (safari.application.activeBrowserWindow) {
          wins.push(safari.application.activeBrowserWindow)
        }
      } else {
        wins = safari.application.browserWindows
      }

      const returnedTabs: any[] = []
      wins.forEach((win: any) => {
        if (!win.tabs) {
          return
        }

        if (options.active && win.activeTab) {
          returnedTabs.push(BrowserApi.makeTabObject(win.activeTab))
        } else if (!options.active) {
          win.tabs.forEach((tab: any) => {
            returnedTabs.push(BrowserApi.makeTabObject(tab))
          })
        }
      })

      return Promise.resolve(returnedTabs)
    }
  }

  static async tabsQueryFirst(options: any): Promise<any> {
    const tabs = await BrowserApi.tabsQuery(options)
    if (tabs.length > 0) {
      return tabs[0]
    }

    return null
  }

  static tabSendMessageData(tab: any, cmd: string, data: any = null): Promise<any[]> {
    const obj: any = {
      cmd: cmd
    }

    if (data != null) {
      obj.data = data
    }

    return BrowserApi.tabSendMessage(tab, obj)
  }

  static tabSendMessage(tab: any, obj: any, options: any = null): Promise<any> {
    if (!tab || !tab.id) {
      return
    }

    if (BrowserApi.isChromeApi) {
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tab.id, obj, options, () => {
          if (chrome.runtime.lastError) {
            // Some error happened
          }
          resolve()
        })
      })
    } else if (BrowserApi.isSafariApi) {
      let t = tab.safariTab
      if (!t || !t.page) {
        const win = safari.application.activeBrowserWindow
        if (safari.application.browserWindows.indexOf(win) !== tab.windowId) {
          return Promise.reject('Window not found.')
        }

        if (win.tabs.length < tab.index + 1) {
          return Promise.reject('Tab not found.')
        }

        t = win.tabs[tab.index]
      }

      if (obj.tab && obj.tab.safariTab) {
        delete obj.tab.safariTab
      }

      if (options != null && options.frameId != null && obj.bitwardenFrameId == null) {
        obj.bitwardenFrameId = options.frameId
      }

      if (t.page) {
        t.page.dispatchMessage('bitwarden', obj)
      }

      return Promise.resolve()
    }
  }

  static getBackgroundPage(): any {
    if (BrowserApi.isChromeApi) {
      return chrome.extension.getBackgroundPage()
    } else if (BrowserApi.isSafariApi) {
      return safari.extension.globalPage.contentWindow
    } else {
      return null
    }
  }

  static getApplicationVersion(): string {
    if (BrowserApi.isChromeApi) {
      return chrome.runtime.getManifest().version
    } else if (BrowserApi.isSafariApi) {
      return safari.extension.displayVersion
    } else {
      return null
    }
  }

  static isPopupOpen(): boolean {
    if (BrowserApi.isChromeApi) {
      return chrome.extension.getViews({ type: 'popup' }).length > 0
    } else if (BrowserApi.isSafariApi) {
      return safari.extension.popovers && safari.extension.popovers.length && safari.extension.popovers[0].visible
    } else {
      return null
    }
  }

  static createNewTab(url: string, extensionPage: boolean = false): any {
    if (BrowserApi.isChromeApi) {
      chrome.tabs.create({ url: url })
      return null
    } else if (BrowserApi.isSafariApi) {
      if (extensionPage && url.indexOf('/') === 0) {
        url = BrowserApi.getAssetUrl(url)
      }
      const tab = safari.application.activeBrowserWindow.openTab()
      if (tab) {
        tab.url = url
      }
      return tab
    } else {
      return
    }
  }

  static getAssetUrl(path: string): string {
    if (BrowserApi.isChromeApi) {
      return chrome.extension.getURL(path)
    } else if (BrowserApi.isSafariApi) {
      if (path.indexOf('/') === 0) {
        path = path.substr(1)
      }
      return safari.extension.baseURI + path
    } else {
      return null
    }
  }

  static messageListener(callback: (message: any, sender: any, response: any) => void) {
    if (BrowserApi.isChromeApi) {
      chrome.runtime.onMessage.addListener((msg: any, sender: any, response: any) => {
        callback(msg, sender, response)
      })
    } else if (BrowserApi.isSafariApi) {
      safari.application.addEventListener(
        'message',
        async (msgEvent: any) => {
          callback(
            msgEvent.message,
            {
              tab: BrowserApi.makeTabObject(msgEvent.target),
              frameId: msgEvent.message != null && msgEvent.message.bitwardenFrameId != null ? msgEvent.message.bitwardenFrameId : null
            },
            () => {
              /* No responses in Safari */
            }
          )
        },
        false
      )
    }
  }

  static closePopup(win: Window) {
    if (BrowserApi.isWebExtensionsApi && BrowserApi.isFirefoxOnAndroid) {
      // Reactivating the active tab dismisses the popup tab. The promise final
      // condition is only called if the popup wasn't already dismissed (future proofing).
      // ref: https://bugzilla.mozilla.org/show_bug.cgi?id=1433604
      browser.tabs.update({ active: true }).finally(win.close)
    } else if (BrowserApi.isWebExtensionsApi || BrowserApi.isChromeApi) {
      win.close()
    } else if (BrowserApi.isSafariApi && safari.extension.popovers && safari.extension.popovers.length > 0) {
      safari.extension.popovers[0].hide()
    }
  }

  static downloadFile(win: Window, blobData: any, blobOptions: any, fileName: string) {
    if (BrowserApi.isSafariApi) {
      const tab = BrowserApi.createNewTab(BrowserApi.getAssetUrl('downloader/index.html'))
      const tabToSend = BrowserApi.makeTabObject(tab)
      setTimeout(async () => {
        BrowserApi.tabSendMessage(tabToSend, {
          cmd: 'downloaderPageData',
          data: {
            blobData: blobData,
            blobOptions: blobOptions,
            fileName: fileName
          }
        })
      }, 1000)
    } else {
      const blob = new Blob([blobData], blobOptions)
      if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveBlob(blob, fileName)
      } else {
        const a = win.document.createElement('a')
        a.href = win.URL.createObjectURL(blob)
        a.download = fileName
        win.document.body.appendChild(a)
        a.click()
        win.document.body.removeChild(a)
      }
    }
  }

  static makeTabObject(tab: any): any {
    if (BrowserApi.isChromeApi) {
      return tab
    }

    if (!tab.browserWindow) {
      return {}
    }

    const winIndex = safari.application.browserWindows.indexOf(tab.browserWindow)
    const tabIndex = tab.browserWindow.tabs.indexOf(tab)
    return {
      id: winIndex + '_' + tabIndex,
      index: tabIndex,
      windowId: winIndex,
      title: tab.title,
      active: tab === tab.browserWindow.activeTab,
      url: tab.url || 'about:blank',
      safariTab: tab
    }
  }

  static gaFilter() {
    return process.env.ENV !== 'production' || (BrowserApi.isSafariApi && safari.application.activeBrowserWindow.activeTab.private)
  }

  static getUILanguage(win: Window) {
    if (BrowserApi.isSafariApi) {
      return win.navigator.language
    } else {
      return chrome.i18n.getUILanguage()
    }
  }
}
