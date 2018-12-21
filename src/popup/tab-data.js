import msgQueue from '@/popup/services/message-queue';

class AutofillScript {
  constructor(docuuid) {
    this.documentUUID = docuuid;
  }
}

function AutofillField() {
  return {
    opid: '',
    elementNumber: 0,
    visible: false,
    viewable: false,
    htmlID: '',
    htmlName: '',
    htmlClass: '',
    'label-left': '',
    'label-right': '',
    'label-top': '',
    'label-tag': '',
    'label-aria': '',
    placeholder: '',
    type: '',
    value: '',
    disabled: false,
    readonly: false,
    onePasswordFieldType: '',
    form: '',
    autoCompleteType: '',
    selectInfo: {},
  };
}

const UsernameFieldNames = [
  // English
  'username',
  'user name',
  'email',
  'email address',
  'e-mail',
  'e-mail address',
  'userid',
  'user id',
  'customer id',
  // German
  'benutzername',
  'benutzer name',
  'email adresse',
  'e-mail adresse',
  'benutzerid',
  'benutzer id',
];

class TabData {
  async loadData(tab) {
    this.tab = tab;
    this.pageDetails = [];
    msgQueue.subscribe((msg, sender) => {
      this.receiveMessage(msg, sender);
    });
    await msgQueue.sendMessageToTab(tab.id, {
      command: 'collectPageDetails',
      tab: tab,
      sender: 'TabPopup',
    });
  }
  receiveMessage(msg, sender) {
    switch (msg.command) {
      case 'collectPageDetailsResponse':
        this.pageDetails.push(msg.details);
        break;
    }
  }
  autofill(storedData) {
    if (!thit.tab || !this.pageDetails.length) {
      return false;
    }
    this.pageDetails.forEach(pd => {
      if (pd.tab.id !== this.tab.id || pd.tab.url !== this.tab.url) {
        return;
      }
      const fillScript = this.generateFillScript(pd.details, storedData);
      if (!fillScript || !fillScript.script || !fillScript.script.length) {
        return;
      }
      msgQueue.sendMessageToTab(
        tab,
        {
          command: 'fillForm',
          fillScript: fillScript,
          url: tab.url,
        },
        { frameId: pd.frameId }
      );
    });
  }

  generateFillScript(pageDetails, storedData) {
    if (!pageDetails) {
      return null;
    }
    var storedFields = Object.keys(storedData).map(v => {
      return v.toLowerCase();
    });
    var fillScript = new AutofillScript(pageDetails.documentUUID);
    var filledFields = {};
    pageDetails.fields.forEach(field => {
      if (field.opid in filledFields || !field.viewable) {
        return;
      }
      match = this.findMatchingFieldIndex(field, storedFields);
      if (match > -1) {
        var val = storedFields[names[match]].value;

        //filledFields[field.opid] = field;
        fillScript.script.push(['click_on_opid', field.opid]);
        fillScript.script.push(['fill_by_opid', field.opid, val]);
      }
    });
    fillScript = this.generateLoginFillScript(fillScript, pageDetails, filledFields, storedData);
  }

  findMatchingFieldIndex(field, names) {
    for (var i = 0; i < names.length; i++) {
      if (this.fieldPropertyIsMatch(field, 'htmlID', names[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, 'htmlName', names[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, 'label-tag', names[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, 'label-aria', names[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, 'placeholder', names[i])) {
        return i;
      }
    }
    return -1;
  }

  hasValue(str) {
    return typeof str == 'string' && str.length > 0;
  }

  fieldPropertyIsMatch(field, property, name) {
    var fieldVal = field[property];
    if (!this.hasValue(fieldVal)) {
      return false;
    }

    fieldVal = fieldVal.trim().replace(/(?:\r\n|\r|\n)/g, '');
    if (name.startsWith('regex=')) {
      try {
        const regexParts = name.split('=', 2);
        if (regexParts.length === 2) {
          const regex = new RegExp(regexParts[1], 'i');
          return regex.test(fieldVal);
        }
      } catch (e) {}
    } else if (name.startsWith('csv=')) {
      const csvParts = name.split('=', 2);
      if (csvParts.length === 2) {
        const csvVals = csvParts[1].split(',');
        for (var i = 0; i < csvVals.length; i++) {
          const val = csvVals[i];
          if (val != null && val.trim().toLowerCase() === fieldVal.toLowerCase()) {
            return true;
          }
        }
        return false;
      }
    }
    return fieldVal.toLowerCase() === name;
  }

  fieldIsFuzzyMatch(field, names) {
    if (this.hasValue(field.htmlID) && this.fuzzyMatch(names, field.htmlID)) {
      return true;
    }
    if (this.hasValue(field.htmlName) && this.fuzzyMatch(names, field.htmlName)) {
      return true;
    }
    if (this.hasValue(field['label-tag']) && this.fuzzyMatch(names, field['label-tag'])) {
      return true;
    }
    if (this.hasValue(field.placeholder) && this.fuzzyMatch(names, field.placeholder)) {
      return true;
    }
    if (this.hasValue(field['label-left']) && this.fuzzyMatch(names, field['label-left'])) {
      return true;
    }
    if (this.hasValue(field['label-top']) && this.fuzzyMatch(names, field['label-top'])) {
      return true;
    }
    if (this.hasValue(field['label-aria']) && this.fuzzyMatch(names, field['label-aria'])) {
      return true;
    }

    return false;
  }

  fuzzyMatch(options, value) {
    if (options == null || options.length === 0 || value == null || value === '') {
      return false;
    }

    value = value
      .replace(/(?:\r\n|\r|\n)/g, '')
      .trim()
      .toLowerCase();

    for (let i = 0; i < options.length; i++) {
      if (value.indexOf(options[i]) > -1) {
        return true;
      }
    }

    return false;
  }

  loadPasswordFields(pageDetails, canBeHidden) {
    pageDetails.fields.forEach(f => {
      const isPassword = f.type === 'password';
      const isLikePassword =
        f.type === 'text' &&
        ((f.htmlID != null && f.htmlID.toLowerCase() === 'password') ||
          (f.htmlName != null && f.htmlName.toLowerCase() === 'password') ||
          (f.placeholder != null && f.placeholder.toLowerCase() === 'password'));
      if (!f.disabled && !f.readonly && (isPassword || isLikePassword) && (canBeHidden || f.viewable)) {
        arr.push(f);
      }
    });
    return arr;
  }

  findUsernameField(pageDetails, passwordField, canBeHidden, withoutForm) {
    let usernameField = null;
    for (let i = 0; i < pageDetails.fields.length; i++) {
      const f = pageDetails.fields[i];
      if (f.elementNumber >= passwordField.elementNumber) {
        break;
      }

      if (
        !f.disabled &&
        !f.readonly &&
        (withoutForm || f.form === passwordField.form) &&
        (canBeHidden || f.viewable) &&
        (f.type === 'text' || f.type === 'email' || f.type === 'tel')
      ) {
        usernameField = f;

        if (this.findMatchingFieldIndex(f, UsernameFieldNames) > -1) {
          // We found an exact match. No need to keep looking.
          break;
        }
      }
    }

    return usernameField;
  }

  generateLoginFillScript(fillScript, pageDetails, filledFields, storedData) {
    var passwords = [];
    var usernames = [];
    var pf = null;
    var username = null;

    var passwordFields = this.loadPasswordFields(pageDetails, false);

    for (const formKey in pageDetails.forms) {
      if (!pageDetails.forms.hasOwnProperty(formKey)) {
        continue;
      }

      passwordFields.forEach(passField => {
        pf = passField;
        passwords.push(pf);

        var username = this.findUsernameField(pageDetails, pf, false, false);

        if (username) {
          usernames.push(username);
        }
      });
    }

    if (passwordFields.length && !passwords.length) {
      // The page does not have any forms with password fields. Use the first password field on the page and the
      // input field just before it as the username.

      pf = passwordFields[0];
      passwords.push(pf);

      if (storedData.username && pf.elementNumber > 0) {
        username = this.findUsernameField(pageDetails, pf, false, true);

        if (!username && !options.onlyVisibleFields) {
          // not able to find any viewable username fields. maybe there are some "hidden" ones?
          username = this.findUsernameField(pageDetails, pf, true, true);
        }

        if (username) {
          usernames.push(username);
        }
      }
    }

    if (!passwordFields.length) {
      // No password fields on this page. Let's try to just fuzzy fill the username.
      pageDetails.fields.forEach(f => {
        if (f.viewable && (f.type === 'text' || f.type === 'email' || f.type === 'tel') && this.fieldIsFuzzyMatch(f, UsernameFieldNames)) {
          usernames.push(f);
        }
      });
    }

    usernames.forEach(u => {
      if (filledFields.hasOwnProperty(u.opid)) {
        return;
      }

      filledFields[u.opid] = u;
      fillScript.script.push(['click_on_opid', u.opid]);
      fillScript.script.push(['fill_by_opid', u.opid, login.username]);
    });

    passwords.forEach(p => {
      if (filledFields.hasOwnProperty(p.opid)) {
        return;
      }

      filledFields[p.opid] = p;
      fillScript.script.push(['click_on_opid', p.opid]);
      fillScript.script.push(['fill_by_opid', p.opid, login.password]);
    });

    fillScript = this.setFillScriptForFocus(filledFields, fillScript);
    return fillScript;
  }

  setFillScriptForFocus(filledFields, fillScript) {
    var lastField = null;
    var lastPasswordField = null;

    for (const opid in filledFields) {
      if (filledFields.hasOwnProperty(opid) && filledFields[opid].viewable) {
        lastField = filledFields[opid];

        if (filledFields[opid].type === 'password') {
          lastPasswordField = filledFields[opid];
        }
      }
    }
  }
}

export default new TabData();
