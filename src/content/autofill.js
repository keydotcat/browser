!(function() {
  /*
    1Password Extension

    Lovingly handcrafted by Dave Teare, Michael Fey, Rad Azzouz, and Roustem Karimov.
    Copyright (c) 2014 AgileBits. All rights reserved.

    ================================================================================

    Copyright (c) 2014 AgileBits Inc.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */

  /*
    MODIFICATIONS FROM ORIGINAL

    1. Populate isFirefox
    2. Remove isChrome and isSafari since they are not used.
    3. Unminify and format to meet Mozilla review requirements.
    4. Remove unnecessary input types from getFormElements query selector and limit number of elements returned.
    5. Remove fakeTested prop.
    6. Rename com.agilebits.* stuff to cat.key.*
    7. Remove "some useful globals" on window
    */

  function collect(document, undefined) {
    // START MODIFICATION
    var isFirefox = navigator.userAgent.indexOf('Firefox') !== -1 || navigator.userAgent.indexOf('Gecko/') !== -1
    // END MODIFICATION

    document.elementsByOPID = {}
    document.addEventListener(
      'input',
      function(inputevent) {
        inputevent.a !== false && inputevent.target.tagName.toLowerCase() === 'input' && (inputevent.target.dataset['cat.key.browser.userEdited'] = 'yes')
      },
      true
    )

    function getPageDetails(theDoc, oneShotId) {
      // start helpers

      // get the value of a dom element's attribute
      function getElementAttrValue(el, attrName) {
        var attrVal = el[attrName]
        if (typeof attrVal === 'string') {
          return attrVal
        }
        attrVal = el.getAttribute(attrName)
        return typeof attrVal === 'string' ? attrVal : null
      }

      // has the element been fake tested?
      function checkIfFakeTested(field, el) {
        if (
          ['text', 'password'].indexOf(el.type.toLowerCase()) === -1 ||
          !(
            passwordRegEx.test(field.value) ||
            passwordRegEx.test(field.htmlID) ||
            passwordRegEx.test(field.htmlName) ||
            passwordRegEx.test(field.placeholder) ||
            passwordRegEx.test(field['label-tag']) ||
            passwordRegEx.test(field['label-data']) ||
            passwordRegEx.test(field['label-aria'])
          )
        ) {
          return false
        }

        if (!field.visible) {
          return true
        }

        if (el.type.toLowerCase() == 'password') {
          return false
        }

        var elType = el.type
        focusElement(el, true)
        return elType !== el.type
      }

      // get the value of a dom element
      function getElementValue(el) {
        switch (toLowerString(el.type)) {
          case 'checkbox':
            return el.checked ? '✓' : ''

          case 'hidden':
            el = el.value
            if (!el || typeof el.length !== 'number') {
              return ''
            }
            el.length > 254 && (el = el.substr(0, 254) + '...SNIPPED')
            return el

          default:
            return el.value
        }
      }

      // get all the options for a "select" element
      function getSelectElementOptions(el) {
        if (!el.options) {
          return null
        }

        var options = Array.prototype.slice.call(el.options).map(function(option) {
          var optionText = option.text
            ? toLowerString(option.text)
                .replace(/\\s/gm, '')
                .replace(/[~`!@$%^&*()\\-_+=:;'\"\\[\\]|\\\\,<.>\\?]/gm, '')
            : null

          return [optionText || null, option.value]
        })

        return {
          options: options
        }
      }

      // get the top label
      function getLabelTop(el) {
        var parent
        for (el = el.parentElement || el.parentNode; el && toLowerString(el.tagName) != 'td'; ) {
          el = el.parentElement || el.parentNode
        }

        if (!el || void 0 === el) {
          return null
        }

        parent = el.parentElement || el.parentNode
        if (parent.tagName.toLowerCase() != 'tr') {
          return null
        }

        parent = parent.previousElementSibling
        if (!parent || (parent.tagName + '').toLowerCase() != 'tr' || (parent.cells && el.cellIndex >= parent.cells.length)) {
          return null
        }

        el = parent.cells[el.cellIndex]
        var elText = el.textContent || el.innerText
        return (elText = cleanText(elText))
      }

      // get all the tags for a given label
      function getLabelTag(el) {
        var docLabel

        var theLabels = []

        if (el.labels && el.labels.length && el.labels.length > 0) {
          theLabels = Array.prototype.slice.call(el.labels)
        } else {
          if (el.id) {
            theLabels = theLabels.concat(Array.prototype.slice.call(queryDoc(theDoc, 'label[for=' + JSON.stringify(el.id) + ']')))
          }

          if (el.name) {
            docLabel = queryDoc(theDoc, 'label[for=' + JSON.stringify(el.name) + ']')

            for (var labelIndex = 0; labelIndex < docLabel.length; labelIndex++) {
              if (theLabels.indexOf(docLabel[labelIndex]) === -1) {
                theLabels.push(docLabel[labelIndex])
              }
            }
          }

          for (var theEl = el; theEl && theEl != theDoc; theEl = theEl.parentNode) {
            if (toLowerString(theEl.tagName) === 'label' && theLabels.indexOf(theEl) === -1) {
              theLabels.push(theEl)
            }
          }
        }

        if (theLabels.length === 0) {
          theEl = el.parentNode
          if (theEl.tagName.toLowerCase() === 'dd' && theEl.previousElementSibling !== null && theEl.previousElementSibling.tagName.toLowerCase() === 'dt') {
            theLabels.push(theEl.previousElementSibling)
          }
        }

        if (theLabels.length < 0) {
          return null
        }

        return theLabels
          .map(function(l) {
            return (l.textContent || l.innerText)
              .replace(/^\\s+/, '')
              .replace(/\\s+$/, '')
              .replace('\\n', '')
              .replace(/\\s{2,}/, ' ')
          })
          .join('')
      }

      // add property and value to the object if there is a value
      function addProp(obj, prop, val, d) {
        if ((d !== 0 && d === val) || val === null || void 0 === val) {
          return
        }

        obj[prop] = val
      }

      // lowercase helper
      function toLowerString(s) {
        return typeof s === 'string' ? s.toLowerCase() : ('' + s).toLowerCase()
      }

      // query the document helper
      function queryDoc(doc, query) {
        var els = []
        try {
          els = doc.querySelectorAll(query)
        } catch (e) {}
        return els
      }

      // end helpers

      var theView = theDoc.defaultView ? theDoc.defaultView : window

      var passwordRegEx = RegExp('((\\\\b|_|-)pin(\\\\b|_|-)|password|passwort|kennwort|(\\\\b|_|-)passe(\\\\b|_|-)|contraseña|senha|密码|adgangskode|hasło|wachtwoord)', 'i')

      // get all the docs
      var theForms = Array.prototype.slice.call(queryDoc(theDoc, 'form')).map(function(formEl, elIndex) {
        var op = {}

        var formOpId = '__form__' + elIndex

        formEl.opid = formOpId
        op.opid = formOpId
        addProp(op, 'htmlName', getElementAttrValue(formEl, 'name'))
        addProp(op, 'htmlID', getElementAttrValue(formEl, 'id'))
        formOpId = getElementAttrValue(formEl, 'action')
        formOpId = new URL(formOpId, window.location.href)
        addProp(op, 'htmlAction', formOpId ? formOpId.href : null)
        addProp(op, 'htmlMethod', getElementAttrValue(formEl, 'method'))

        return op
      })

      // get all the form fields
      var theFields = Array.prototype.slice.call(getFormElements(theDoc, 50)).map(function(el, elIndex) {
        var field = {}

        var opId = '__' + elIndex

        var elMaxLen = el.maxLength == -1 ? 999 : el.maxLength

        if (!elMaxLen || (typeof elMaxLen === 'number' && isNaN(elMaxLen))) {
          elMaxLen = 999
        }

        theDoc.elementsByOPID[opId] = el
        el.opid = opId
        field.opid = opId
        field.elementNumber = elIndex
        addProp(field, 'maxLength', Math.min(elMaxLen, 999), 999)
        field.visible = isElementVisible(el)
        field.viewable = isElementViewable(el)
        addProp(field, 'htmlID', getElementAttrValue(el, 'id'))
        addProp(field, 'htmlName', getElementAttrValue(el, 'name'))
        addProp(field, 'htmlClass', getElementAttrValue(el, 'class'))
        addProp(field, 'tabindex', getElementAttrValue(el, 'tabindex'))
        addProp(field, 'title', getElementAttrValue(el, 'title'))
        // START MODIFICATION
        addProp(field, 'userEdited', !!el.dataset['com.browser.browser.userEdited'])
        // END MODIFICATION

        if (toLowerString(el.type) != 'hidden') {
          addProp(field, 'label-tag', getLabelTag(el))
          addProp(field, 'label-data', getElementAttrValue(el, 'data-label'))
          addProp(field, 'label-aria', getElementAttrValue(el, 'aria-label'))
          addProp(field, 'label-top', getLabelTop(el))
          var labelArr = []
          for (var sib = el; sib && sib.nextSibling; ) {
            sib = sib.nextSibling
            if (isKnownTag(sib)) {
              break
            }
            checkNodeType(labelArr, sib)
          }
          addProp(field, 'label-right', labelArr.join(''))
          labelArr = []
          shiftForLeftLabel(el, labelArr)
          labelArr = labelArr.reverse().join('')
          addProp(field, 'label-left', labelArr)
          addProp(field, 'placeholder', getElementAttrValue(el, 'placeholder'))
        }

        addProp(field, 'rel', getElementAttrValue(el, 'rel'))
        addProp(field, 'type', toLowerString(getElementAttrValue(el, 'type')))
        addProp(field, 'value', getElementValue(el))
        addProp(field, 'checked', el.checked, false)
        addProp(field, 'autoCompleteType', el.getAttribute('x-autocompletetype') || el.getAttribute('autocompletetype') || el.getAttribute('autocomplete'), 'off')
        addProp(field, 'disabled', el.disabled)
        addProp(field, 'readonly', el.b || el.readOnly)
        addProp(field, 'selectInfo', getSelectElementOptions(el))
        addProp(field, 'aria-hidden', el.getAttribute('aria-hidden') == 'true', false)
        addProp(field, 'aria-disabled', el.getAttribute('aria-disabled') == 'true', false)
        addProp(field, 'aria-haspopup', el.getAttribute('aria-haspopup') == 'true', false)
        addProp(field, 'data-unmasked', el.dataset.unmasked)
        addProp(field, 'data-stripe', getElementAttrValue(el, 'data-stripe'))
        addProp(field, 'onepasswordFieldType', el.dataset.onepasswordFieldType || el.type)
        addProp(field, 'onepasswordDesignation', el.dataset.onepasswordDesignation)
        addProp(field, 'onepasswordSignInUrl', el.dataset.onepasswordSignInUrl)
        addProp(field, 'onepasswordSectionTitle', el.dataset.onepasswordSectionTitle)
        addProp(field, 'onepasswordSectionFieldKind', el.dataset.onepasswordSectionFieldKind)
        addProp(field, 'onepasswordSectionFieldTitle', el.dataset.onepasswordSectionFieldTitle)
        addProp(field, 'onepasswordSectionFieldValue', el.dataset.onepasswordSectionFieldValue)

        if (el.form) {
          field.form = getElementAttrValue(el.form, 'opid')
        }

        // START MODIFICATION
        //addProp(field, 'fakeTested', checkIfFakeTested(field, el), false);
        // END MODIFICATION

        return field
      })

      // test form fields
      theFields
        .filter(function(f) {
          return f.fakeTested
        })
        .forEach(function(f) {
          var el = theDoc.elementsByOPID[f.opid]
          el.getBoundingClientRect()

          var originalValue = el.value
          // click it
          !el || (el && typeof el.click !== 'function') || el.click()
          focusElement(el, false)

          el.dispatchEvent(doEventOnElement(el, 'keydown'))
          el.dispatchEvent(doEventOnElement(el, 'keypress'))
          el.dispatchEvent(doEventOnElement(el, 'keyup'))

          el.value !== originalValue && (el.value = originalValue)

          el.click && el.click()
          f.postFakeTestVisible = isElementVisible(el)
          f.postFakeTestViewable = isElementViewable(el)
          f.postFakeTestType = el.type

          var elValue = el.value

          var event1 = el.ownerDocument.createEvent('HTMLEvents')

          var event2 = el.ownerDocument.createEvent('HTMLEvents')
          el.dispatchEvent(doEventOnElement(el, 'keydown'))
          el.dispatchEvent(doEventOnElement(el, 'keypress'))
          el.dispatchEvent(doEventOnElement(el, 'keyup'))
          event2.initEvent('input', true, true)
          el.dispatchEvent(event2)
          event1.initEvent('change', true, true)
          el.dispatchEvent(event1)

          el.blur()
          el.value !== elValue && (el.value = elValue)
        })

      // build out the page details object. this is the final result
      var pageDetails = {
        documentUUID: oneShotId,
        title: theDoc.title,
        url: theView.location.href,
        documentUrl: theDoc.location.href,
        tabUrl: theView.location.href,
        forms: (function(forms) {
          var formObj = {}
          forms.forEach(function(f) {
            formObj[f.opid] = f
          })
          return formObj
        })(theForms),
        fields: theFields,
        collectedTimestamp: new Date().getTime()
      }

      // get proper page title. maybe they are using the special meta tag?
      var theTitle = document.querySelector('[data-onepassword-title]')
      if (theTitle && theTitle.dataset[DISPLAY_TITLE_ATTRIBUE]) {
        pageDetails.displayTitle = theTitle.dataset.onepasswordTitle
      }

      return pageDetails
    }

    document.elementForOPID = getElementForOPID

    function doEventOnElement(kedol, fonor) {
      var quebo
      isFirefox
        ? ((quebo = document.createEvent('KeyboardEvent')), quebo.initKeyEvent(fonor, true, false, null, false, false, false, false, 0, 0))
        : ((quebo = kedol.ownerDocument.createEvent('Events')),
          quebo.initEvent(fonor, true, false),
          (quebo.charCode = 0),
          (quebo.keyCode = 0),
          (quebo.which = 0),
          (quebo.srcElement = kedol),
          (quebo.target = kedol))
      return quebo
    }

    // clean up the text
    function cleanText(s) {
      var sVal = null
      s && ((sVal = s.replace(/^\\s+|\\s+$|\\r?\\n.*$/gm, '')), (sVal = sVal.length > 0 ? sVal : null))
      return sVal
    }

    // check the node type and adjust the array accordingly
    function checkNodeType(arr, el) {
      var theText = ''
      el.nodeType === 3 ? (theText = el.nodeValue) : el.nodeType === 1 && (theText = el.textContent || el.innerText)
      ;(theText = cleanText(theText)) && arr.push(theText)
    }

    function isKnownTag(el) {
      if (el && void 0 !== el) {
        var tags = 'select option input form textarea button table iframe body head script'.split(' ')

        if (el) {
          var elTag = el ? (el.tagName || '').toLowerCase() : ''
          return tags.constructor == Array ? tags.indexOf(elTag) >= 0 : elTag === tags
        } else {
          return false
        }
      } else {
        return true
      }
    }

    function shiftForLeftLabel(el, arr, steps) {
      var sib
      for (steps || (steps = 0); el && el.previousSibling; ) {
        el = el.previousSibling
        if (isKnownTag(el)) {
          return
        }

        checkNodeType(arr, el)
      }
      if (el && arr.length === 0) {
        for (sib = null; !sib; ) {
          el = el.parentElement || el.parentNode
          if (!el) {
            return
          }
          for (sib = el.previousSibling; sib && !isKnownTag(sib) && sib.lastChild; ) {
            sib = sib.lastChild
          }
        }

        // base case and recurse
        isKnownTag(sib) || (checkNodeType(arr, sib), arr.length === 0 && shiftForLeftLabel(sib, arr, steps + 1))
      }
    }

    // is a dom element visible on screen?
    function isElementVisible(el) {
      var theEl = el
      el = (el = el.ownerDocument) ? el.defaultView : {}

      // walk the dom tree
      for (var elStyle; theEl && theEl !== document; ) {
        elStyle = el.getComputedStyle ? el.getComputedStyle(theEl, null) : theEl.style
        if (!elStyle) {
          return true
        }

        if (elStyle.display === 'none' || elStyle.visibility == 'hidden') {
          return false
        }

        // walk up
        theEl = theEl.parentNode
      }

      return theEl === document
    }

    // is a dom element "viewable" on screen?
    function isElementViewable(el) {
      var theDoc = el.ownerDocument.documentElement

      var rect = el.getBoundingClientRect()

      var docScrollWidth = theDoc.scrollWidth

      var kosri = theDoc.scrollHeight

      var leftOffset = rect.left - theDoc.clientLeft

      var topOffset = rect.top - theDoc.clientTop

      var theRect

      if (!isElementVisible(el) || !el.offsetParent || el.clientWidth < 10 || el.clientHeight < 10) {
        return false
      }

      var rects = el.getClientRects()
      if (rects.length === 0) {
        return false
      }

      for (var i = 0; i < rects.length; i++) {
        if (((theRect = rects[i]), theRect.left > docScrollWidth || theRect.right < 0)) {
          return false
        }
      }

      if (leftOffset < 0 || leftOffset > docScrollWidth || topOffset < 0 || topOffset > kosri) {
        return false
      }

      // walk the tree
      for (
        var pointEl = el.ownerDocument.elementFromPoint(
          leftOffset + (rect.right > window.innerWidth ? (window.innerWidth - leftOffset) / 2 : rect.width / 2),
          topOffset + (rect.bottom > window.innerHeight ? (window.innerHeight - topOffset) / 2 : rect.height / 2)
        );
        pointEl && pointEl !== el && pointEl !== document;

      ) {
        if (pointEl.tagName && typeof pointEl.tagName === 'string' && pointEl.tagName.toLowerCase() === 'label' && el.labels && el.labels.length > 0) {
          return Array.prototype.slice.call(el.labels).indexOf(pointEl) >= 0
        }

        // walk up
        pointEl = pointEl.parentNode
      }

      return pointEl === el
    }

    function getElementForOPID(opId) {
      var theEl
      if (void 0 === opId || opId === null) {
        return null
      }

      try {
        var formEls = Array.prototype.slice.call(getFormElements(document))
        var filteredFormEls = formEls.filter(function(el) {
          return el.opid == opId
        })

        if (filteredFormEls.length > 0) {
          ;(theEl = filteredFormEls[0]), filteredFormEls.length > 1 && console.warn('More than one element found with opid ' + opId)
        } else {
          var theIndex = parseInt(opId.split('__')[1], 10)
          isNaN(theIndex) || (theEl = formEls[theIndex])
        }
      } catch (e) {
        console.error('An unexpected error occurred: ' + e)
      } finally {
        return theEl
      }
    }

    // get all the form elements that we care about
    function getFormElements(theDoc, limit) {
      // START MODIFICATION
      var els = []
      try {
        var elsList = theDoc.querySelectorAll(
          'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])' + ':not([type="button"]):not([type="image"]):not([type="file"]), select'
        )
        els = Array.prototype.slice.call(elsList)
      } catch (e) {}

      if (!limit || els.length <= limit) {
        return els
      }

      // non-checkboxes/radios have higher priority
      var returnEls = []
      var unimportantEls = []
      for (var i = 0; i < els.length; i++) {
        if (returnEls.length >= limit) {
          break
        }

        var el = els[i]
        var type = el.type ? el.type.toLowerCase() : el.type
        if (type === 'checkbox' || type === 'radio') {
          unimportantEls.push(el)
        } else {
          returnEls.push(el)
        }
      }

      var unimportantElsToAdd = limit - returnEls.length
      if (unimportantElsToAdd > 0) {
        returnEls = returnEls.concat(unimportantEls.slice(0, unimportantElsToAdd))
      }

      return returnEls
      // END MODIFICATION
    }

    // focus the element and optionally restore its original value
    function focusElement(el, setVal) {
      if (setVal) {
        var initialValue = el.value
        el.focus()

        if (el.value !== initialValue) {
          el.value = initialValue
        }
      } else {
        el.focus()
      }
    }

    return JSON.stringify(getPageDetails(document, 'oneshotUUID'))
  }

  function fill(document, fillScript, undefined) {
    var isFirefox = navigator.userAgent.indexOf('Firefox') !== -1 || navigator.userAgent.indexOf('Gecko/') !== -1

    var markTheFilling = true

    var animateTheFilling = true

    // Check if URL is not secure when the original saved one was
    function urlNotSecure(savedURL) {
      var passwordInputs = null
      if (!savedURL) {
        return false
      }

      return !!(
        savedURL.indexOf('https://') === 0 &&
        document.location.protocol === 'http:' &&
        ((passwordInputs = document.querySelectorAll('input[type=password]')),
        passwordInputs.length > 0 &&
          ((confirmResult = confirm(
            'Warning: This is an unsecured HTTP page, and any information you submit can potentially be seen and changed by others. This Login was originally saved on a secure (HTTPS) page.\\n\\nDo you still wish to fill this login?'
          )),
          confirmResult == 0))
      )
    }

    function doFill(fillScript) {
      var fillScriptOps

      var theOpIds = []

      var fillScriptProperties = fillScript.properties

      var operationDelayMs = 1

      var doOperation

      var operationsToDo = []

      fillScriptProperties && fillScriptProperties.delay_between_operations && (operationDelayMs = fillScriptProperties.delay_between_operations)

      if (urlNotSecure(fillScript.savedURL)) {
        return
      }

      doOperation = function(ops, theOperation) {
        var op = ops[0]
        if (void 0 === op) {
          theOperation()
        } else {
          // should we delay?
          if (op.operation === 'delay' || op[0] === 'delay') {
            operationDelayMs = op.parameters ? op.parameters[0] : op[1]
          } else {
            if ((op = normalizeOp(op))) {
              for (var opIndex = 0; opIndex < op.length; opIndex++) {
                operationsToDo.indexOf(op[opIndex]) === -1 && operationsToDo.push(op[opIndex])
              }
            }
            theOpIds = theOpIds.concat(
              operationsToDo.map(function(operationToDo) {
                return operationToDo && operationToDo.hasOwnProperty('opid') ? operationToDo.opid : null
              })
            )
          }
          setTimeout(function() {
            doOperation(ops.slice(1), theOperation)
          }, operationDelayMs)
        }
      }

      if ((fillScriptOps = fillScript.options)) {
        fillScriptOps.hasOwnProperty('animate') && (animateTheFilling = fillScriptOps.animate),
          fillScriptOps.hasOwnProperty('markFilling') && (markTheFilling = fillScriptOps.markFilling)
      }

      // don't mark a password filling
      fillScript.itemType && fillScript.itemType === 'fillPassword' && (markTheFilling = false)

      if (!fillScript.hasOwnProperty('script')) {
        return
      }

      // custom fill script

      fillScriptOps = fillScript.script
      doOperation(fillScriptOps, function() {
        // Done now
        // Do we have anything to autosubmit?
        if (fillScript.hasOwnProperty('autosubmit') && typeof autosubmit === 'function') {
          ;(fillScript.itemType && fillScript.itemType !== 'fillLogin') ||
            (operationsToDo.length > 0
              ? setTimeout(function() {
                  autosubmit(fillScript.autosubmit, fillScriptProperties.allow_clicky_autosubmit, operationsToDo)
                }, AUTOSUBMIT_DELAY)
              : DEBUG_AUTOSUBMIT && console.log('[AUTOSUBMIT] Not attempting to submit since no fields were filled: ', operationsToDo))
        }

        // handle protectedGlobalPage
        if (typeof protectedGlobalPage === 'object') {
          protectedGlobalPage.b(
            'fillItemResults',
            {
              documentUUID: documentUUID,
              fillContextIdentifier: fillScript.fillContextIdentifier,
              usedOpids: theOpIds
            },
            function() {
              fillingItemType = null
            }
          )
        }
      })
    }

    // fill for reference
    var thisFill = {
      fill_by_opid: doFillByOpId,
      fill_by_query: doFillByQuery,
      click_on_opid: doClickByOpId,
      click_on_query: doClickByQuery,
      touch_all_fields: touchAllFields,
      simple_set_value_by_query: doSimpleSetByQuery,
      focus_by_opid: doFocusByOpId,
      delay: null
    }

    // normalize the op versus the reference
    function normalizeOp(op) {
      var thisOperation
      if (op.hasOwnProperty('operation') && op.hasOwnProperty('parameters')) {
        ;(thisOperation = op.operation), (op = op.parameters)
      } else {
        if (Object.prototype.toString.call(op) === '[object Array]') {
          ;(thisOperation = op[0]), (op = op.splice(1))
        } else {
          return null
        }
      }
      return thisFill.hasOwnProperty(thisOperation) ? thisFill[thisOperation].apply(this, op) : null
    }

    // do a fill by opid operation
    function doFillByOpId(opId, op) {
      var el = getElementByOpId(opId)
      return el ? (fillTheElement(el, op), [el]) : null
    }

    // do a fill by query operation
    function doFillByQuery(query, op) {
      var elements = selectAllFromDoc(query)
      return Array.prototype.map.call(
        Array.prototype.slice.call(elements),
        function(el) {
          fillTheElement(el, op)
          return el
        },
        this
      )
    }

    // do a simple set value by query
    function doSimpleSetByQuery(query, valueToSet) {
      var elements = selectAllFromDoc(query)

      var arr = []
      Array.prototype.forEach.call(Array.prototype.slice.call(elements), function(el) {
        el.disabled || el.a || el.readOnly || void 0 === el.value || ((el.value = valueToSet), arr.push(el))
      })
      return arr
    }

    // focus by opid
    function doFocusByOpId(opId) {
      var el = getElementByOpId(opId)
      if (el) {
        typeof el.click === 'function' && el.click(), typeof el.focus === 'function' && doFocusElement(el, true)
      }

      return null
    }

    // do a click by opid operation
    function doClickByOpId(opId) {
      var el = getElementByOpId(opId)
      return el ? (clickElement(el) ? [el] : null) : null
    }

    // do a click by query operation
    function doClickByQuery(query) {
      query = selectAllFromDoc(query)
      return Array.prototype.map.call(
        Array.prototype.slice.call(query),
        function(el) {
          clickElement(el)
          typeof el.click === 'function' && el.click()
          typeof el.focus === 'function' && doFocusElement(el, true)
          return [el]
        },
        this
      )
    }

    var checkRadioTrueOps = {
      true: true,
      y: true,
      1: true,
      yes: true,
      '✓': true
    }

    var styleTimeout = 200

    // fill an element
    function fillTheElement(el, op) {
      var shouldCheck
      if (el && op !== null && void 0 !== op && !(el.disabled || el.a || el.readOnly)) {
        switch ((markTheFilling && el.form && !el.form.opfilled && (el.form.opfilled = true), el.type ? el.type.toLowerCase() : null)) {
          case 'checkbox':
            shouldCheck = op && op.length >= 1 && checkRadioTrueOps.hasOwnProperty(op.toLowerCase()) && checkRadioTrueOps[op.toLowerCase()] === true
            el.checked === shouldCheck ||
              doAllFillOperations(el, function(theEl) {
                theEl.checked = shouldCheck
              })
            break
          case 'radio':
            checkRadioTrueOps[op.toLowerCase()] === true && el.click()
            break
          default:
            el.value == op ||
              doAllFillOperations(el, function(theEl) {
                theEl.value = op
              })
        }
      }
    }

    // do all the full operations needed
    function doAllFillOperations(el, afterValSetFunc) {
      setValueForElement(el)
      afterValSetFunc(el)
      setValueForElementByEvent(el)
      canSeeElementToStyle(el) &&
        ((el.className += ' cat-keycat-browser-animated-fill'),
        setTimeout(function() {
          // START MODIFICATION
          el && el.className && (el.className = el.className.replace(/(\\s)?cat-keycat-browser-animated-fill/, ''))
          // END MODIFICATION
        }, styleTimeout))
    }

    document.elementForOPID = getElementByOpId

    // normalize the event since firefox handles events differently than others
    function normalizeEvent(el, eventName) {
      var ev
      if (isFirefox) {
        ev = document.createEvent('KeyboardEvent')
        ev.initKeyEvent(eventName, true, false, null, false, false, false, false, 0, 0)
      } else {
        ev = el.ownerDocument.createEvent('Events')
        ev.initEvent(eventName, true, false)
        ev.charCode = 0
        ev.keyCode = 0
        ev.which = 0
        //ev.srcElement = el;
        //ev.target = el;
      }

      return ev
    }

    // set value of the given element
    function setValueForElement(el) {
      var valueToSet = el.value
      clickElement(el)
      doFocusElement(el, false)
      el.dispatchEvent(normalizeEvent(el, 'keydown'))
      el.dispatchEvent(normalizeEvent(el, 'keypress'))
      el.dispatchEvent(normalizeEvent(el, 'keyup'))
      el.value !== valueToSet && (el.value = valueToSet)
    }

    // set value of the given element by using events
    function setValueForElementByEvent(el) {
      var valueToSet = el.value

      var ev1 = el.ownerDocument.createEvent('HTMLEvents')

      var ev2 = el.ownerDocument.createEvent('HTMLEvents')

      el.dispatchEvent(normalizeEvent(el, 'keydown'))
      el.dispatchEvent(normalizeEvent(el, 'keypress'))
      el.dispatchEvent(normalizeEvent(el, 'keyup'))
      ev2.initEvent('input', true, true)
      el.dispatchEvent(ev2)
      ev1.initEvent('change', true, true)
      el.dispatchEvent(ev1)
      el.blur()
      el.value !== valueToSet && (el.value = valueToSet)
    }

    // click on an element
    function clickElement(el) {
      if (!el || (el && typeof el.click !== 'function')) {
        return false
      }
      el.click()
      return true
    }

    // get all fields we care about
    function getAllFields() {
      var r = RegExp('((\\\\b|_|-)pin(\\\\b|_|-)|password|passwort|kennwort|passe|contraseña|senha|密码|adgangskode|hasło|wachtwoord)', 'i')
      return Array.prototype.slice.call(selectAllFromDoc("input[type='text']")).filter(function(el) {
        return el.value && r.test(el.value)
      }, this)
    }

    // touch all the fields
    function touchAllFields() {
      getAllFields().forEach(function(el) {
        setValueForElement(el)
        el.click && el.click()
        setValueForElementByEvent(el)
      })
    }

    // can we see the element to apply some styling?
    function canSeeElementToStyle(el) {
      var currentEl
      if ((currentEl = animateTheFilling)) {
        a: {
          currentEl = el
          for (var owner = el.ownerDocument, owner = owner ? owner.defaultView : {}, theStyle; currentEl && currentEl !== document; ) {
            theStyle = owner.getComputedStyle ? owner.getComputedStyle(currentEl, null) : currentEl.style
            if (!theStyle) {
              currentEl = true
              break a
            }
            if (theStyle.display === 'none' || theStyle.visibility == 'hidden') {
              currentEl = false
              break a
            }
            currentEl = currentEl.parentNode
          }
          currentEl = currentEl === document
        }
      }
      return currentEl ? 'email text password number tel url'.split(' ').indexOf(el.type || '') !== -1 : false
    }

    // find the element for this operation
    function getElementByOpId(theOpId) {
      var theElement
      if (void 0 === theOpId || theOpId === null) {
        return null
      }
      try {
        var elements = Array.prototype.slice.call(selectAllFromDoc('input, select, button'))
        var filteredElements = elements.filter(function(o) {
          return o.opid == theOpId
        })
        if (filteredElements.length > 0) {
          ;(theElement = filteredElements[0]), filteredElements.length > 1 && console.warn('More than one element found with opid ' + theOpId)
        } else {
          var elIndex = parseInt(theOpId.split('__')[1], 10)
          isNaN(elIndex) || (theElement = elements[elIndex])
        }
      } catch (e) {
        console.error('An unexpected error occurred: ' + e)
      } finally {
        return theElement
      }
    }

    // helper for doc.querySelectorAll
    function selectAllFromDoc(theSelector) {
      var d = document

      var elements = []
      try {
        elements = d.querySelectorAll(theSelector)
      } catch (e) {}
      return elements
    }

    // focus an element and optionally re-set its value after focusing
    function doFocusElement(el, setValue) {
      if (setValue) {
        var existingValue = el.value
        el.focus()
        el.value !== existingValue && (el.value = existingValue)
      } else {
        el.focus()
      }
    }

    doFill(fillScript)

    return JSON.stringify({
      success: true
    })
  }

  /*
    End 1Password Extension
    */

  if (typeof safari !== 'undefined' && navigator.userAgent.indexOf(' Safari/') !== -1 && navigator.userAgent.indexOf('Chrome') === -1) {
    if (window.__keycatFrameId == null) {
      window.__keycatFrameId = Math.floor(Math.random() * Math.floor(99999999))
    }
    safari.self.addEventListener(
      'message',
      function(msgEvent) {
        var msg = msgEvent.message
        if (msg.keycatFrameId != null && window.__bitwardenFrameId !== msg.bitwardenFrameId) {
          return
        }

        if (msg.cmd === 'collectPageDetails') {
          var pageDetails = collect(document)
          var pageDetailsObj = JSON.parse(pageDetails)
          safari.self.tab.dispatchMessage('keycat', {
            cmd: 'collectPageDetailsResponse',
            tab: msg.tab,
            details: pageDetailsObj,
            sender: msg.sender,
            keycatFrameId: window.__bitwardenFrameId
          })
        } else if (msg.cmd === 'fillForm') {
          fill(document, msg.fillScript)
        }
      },
      false
    )
    return
  }

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.cmd === 'collectPageDetails') {
      var pageDetails = collect(document)
      var pageDetailsObj = JSON.parse(pageDetails)
      chrome.runtime.sendMessage({
        cmd: 'collectPageDetailsResponse',
        tab: msg.tab,
        details: pageDetailsObj,
        sender: msg.sender
      })
      sendResponse()
      return true
    } else if (msg.cmd === 'fillForm') {
      fill(document, msg.fillScript)
      sendResponse()
      return true
    }
  })
})()
