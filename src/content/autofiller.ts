document.addEventListener('DOMContentLoaded', event => {
  let pageHref: string = null
  let filledThisHref = false
  let delayFillTimeout: number

  const isSafari = typeof safari !== 'undefined' && navigator.userAgent.indexOf(' Safari/') !== -1 && navigator.userAgent.indexOf('Chrome') === -1

  if (isSafari) {
    if ((window as any).__keycatFrameId == null) {
      ;(window as any).__keycatFrameId = Math.floor(Math.random() * Math.floor(99999999))
    }
    const responseCommand = 'autofillerAutofillOnPageLoadEnabledResponse'
    safari.self.tab.dispatchMessage('keycat', {
      cmd: 'bgGetDataForTab',
      responseCommand: responseCommand,
      keycatFrameId: (window as any).__bitwardenFrameId
    })
    safari.self.addEventListener(
      'message',
      (msgEvent: any) => {
        const msg = msgEvent.message
        if (msg.keycatFrameId != null && (window as any).__bitwardenFrameId !== msg.bitwardenFrameId) {
          return
        }
        if (msg.cmd === responseCommand && msg.data.autofillEnabled === true) {
          setInterval(() => doFillIfNeeded(), 500)
        } else if (msg.cmd === 'fillForm' && pageHref === msg.url) {
          filledThisHref = true
        }
      },
      false
    )
    return
  } else {
    const enabledKey = 'enableAutoFillOnPageLoad'
    chrome.storage.local.get(enabledKey, (obj: any) => {
      if (obj != null && obj[enabledKey] === true) {
        setInterval(() => doFillIfNeeded(), 500)
      }
    })
    chrome.runtime.onMessage.addListener((msg: any, sender: any, sendResponse: Function) => {
      if (msg.cmd === 'fillForm' && pageHref === msg.url) {
        filledThisHref = true
      }
    })
  }

  function doFillIfNeeded(force: boolean = false) {
    if (force || pageHref !== window.location.href) {
      if (!force) {
        // Some websites are slow and rendering all page content. Try to fill again later
        // if we haven't already.
        filledThisHref = false
        if (delayFillTimeout != null) {
          window.clearTimeout(delayFillTimeout)
        }
        delayFillTimeout = window.setTimeout(() => {
          if (!filledThisHref) {
            doFillIfNeeded(true)
          }
        }, 1500)
      }

      pageHref = window.location.href
      const msg: any = {
        cmd: 'bgCollectPageDetails',
        sender: 'autofiller'
      }

      if (isSafari) {
        msg.keycatFrameId = (window as any).__bitwardenFrameId
        safari.self.tab.dispatchMessage('keycat', msg)
      } else {
        chrome.runtime.sendMessage(msg)
      }
    }
  }
})
