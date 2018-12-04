import SecretData from '@/classes/secret_data';
import LocationData from '@/classes/location_data';
import NoteData from '@/classes/note_data';
import { DateTime } from 'luxon';

export default class Secret {
  constructor({ secretId = '', vaultId = '', teamId = '', createdAt, updatedAt, vaultVersion, data } = {}) {
    this.secretId = secretId;
    this.vaultId = vaultId;
    this.teamId = teamId;
    this.vaultVersion = vaultVersion;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    if (data) {
      if (data instanceof LocationData || data instanceof NoteData) {
        this.data = data;
      } else {
        this.data = new SecretData(data);
      }
    } else {
      throw new Error('Empty data');
    }
  }
  get fullId() {
    return `${this.teamId}.${this.vaultId}.${this.secretId}`;
  }
  get createdAt() {
    return DateTime.fromISO(this._createdAt);
  }
  get updatedAt() {
    return DateTime.fromISO(this._updatedAt);
  }
  cloneAsObject() {
    return {
      secretId: this.secretId,
      vaultId: this.vautId,
      teamId: this.teamId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      vaultVersion: this.vaultVersion,
      data: this.data.cloneAsObject(),
    };
  }

  static createLocation() {
    return new Secret({ data: new LocationData() });
  }

  static createNote() {
    return new Secret({ data: new NoteData() });
  }
}
