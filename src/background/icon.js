import * as mt from '@/store/mutation-types';

export default class IconMgr {
  setOffIcon() {
    this.setIcon('-off');
  }

  setOnIcon() {
    this.setIcon('-on');
  }

  setIcon(suffix) {
    var options = {
      path: {
        '48': `icons/icon_48${suffix}.png`,
        '128': `icons/icon_128${suffix}.png`,
      },
    };
    chrome.browserAction.setIcon(options);
  }

  subscribeToStore(store) {
    store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'session/' + mt.SESSION_LOGIN:
        case 'session/' + mt.SESSION_EXISTS:
          this.setIcon('-on');
          break;
        case 'session/' + mt.SESSION_LOGOUT:
          this.setOffIcon();
          break;
      }
    });
  }
}
