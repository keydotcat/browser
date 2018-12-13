import AutofillField from '../models/autofillField';
import AutofillPageDetails from '../models/autofillPageDetails';
import AutofillScript from '../models/autofillScript';

const UsernameFieldNames: string[] = [
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
  //Catalan
  'usuari',
  'adreça email',
  "identificador d'usuari",
  //Spanish
  'usuario',
  'dirección de email',
  'identificador de usuario',
];

export default class AutofillMgr {
  constructor() {}

  getFormsWithPasswordFields(pageDetails: AutofillPageDetails): any[] {
    const formData: any[] = [];

    const passwordFields = this.loadPasswordFields(pageDetails, true);
    if (passwordFields.length === 0) {
      return formData;
    }

    for (const formKey in pageDetails.forms) {
      if (!pageDetails.forms.hasOwnProperty(formKey)) {
        continue;
      }

      const formPasswordFields = passwordFields.filter(pf => formKey === pf.form);
      if (formPasswordFields.length > 0) {
        let uf = this.findUsernameField(pageDetails, formPasswordFields[0], false, false);
        if (uf == null) {
          // not able to find any viewable username fields. maybe there are some "hidden" ones?
          uf = this.findUsernameField(pageDetails, formPasswordFields[0], true, false);
        }
        formData.push({
          form: pageDetails.forms[formKey],
          password: formPasswordFields[0],
          username: uf,
          passwords: formPasswordFields,
        });
      }
    }
    return formData;
  }

  private loadPasswordFields(pageDetails: AutofillPageDetails, canBeHidden: boolean) {
    const arr: AutofillField[] = [];
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

  private findUsernameField(pageDetails: AutofillPageDetails, passwordField: AutofillField, canBeHidden: boolean, withoutForm: boolean) {
    let usernameField: AutofillField = null;
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

  private findMatchingFieldIndex(field: AutofillField, names: string[]): number {
    for (let i = 0; i < names.length; i++) {
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

  private fieldPropertyIsMatch(field: any, property: string, name: string): boolean {
    let fieldVal = field[property] as string;
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
        for (let i = 0; i < csvVals.length; i++) {
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

  private hasValue(str: string): boolean {
    return str && str !== '';
  }
}
