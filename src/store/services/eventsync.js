import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';

const EventSource = NativeEventSource || EventSourcePolyfill;

import request from '@/store/services/request';

class EventSync {
  connect() {
    this.url = `${request.url}/eventsource`;
    var es = new EventSourcePolyfill(this.url, { headers: request.getHeaders() });
    es.addEventListener('message', ev => {
      this.onMsg(ev);
    });
    es.addEventListener('open', () => {
      console.log('Connected to event source');
    });
    es.addEventListener('error', err => {
      console.log(`Error in event source connection ${err.statusText}`);
    });
  }
  omMsg(msg) {
    console.log('Got msg', msg);
  }
}

export default new EventSync();
