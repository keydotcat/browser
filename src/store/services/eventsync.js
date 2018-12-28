import { EventSourcePolyfill } from 'event-source-polyfill';
import store from '@/store';
import Secret from '@/commonjs/secrets/secret';
import request from '@/store/services/request';

class EventSync {
  connect() {
    this.url = `${request.url}/eventsource`;
    var es = new EventSourcePolyfill(this.url, request.getHeaders());
    es.addEventListener('message', ev => {
      this.onMsg(ev);
    });
    es.addEventListener('open', () => {
      console.log('Connected to event source');
    });
    es.addEventListener('error', err => {
      console.log(`Error in event source connection ${err.statusText}`);
    });
    es.addEventListener('timeout', err => {
      console.log('Timeout');
    });
    es.addEventListener('close', err => {
      console.log('Close');
    });
  }
  onMsg(msg) {
    var payload = JSON.parse(msg.data);
    console.log('Ga', payload);
    var req = {
      teamId: payload.team,
      vaultId: payload.vault,
    };
    switch (payload.action) {
      case 'secret:new':
        req.secretData = Secret.fromObject(payload.secret);
        store.dispatch('secrets/create', req);
      case 'secret:change':
        req.secretId = payload.secret.id;
        req.secretData = Secret.fromObject(payload.secret);
        store.dispatch('secrets/create', req);
      case 'secret:remove':
        req.secretId = payload.secret.id;
        store.dispatch('secrets/delete', req);
    }
  }
}

export default new EventSync();
