import msgBroker from '@/popup/services/msg-broker';
import Autofill from '@/popup/autofill.js';

class TabData {
  async loadData(tab) {
    this.tab = tab;
    this.pageDetails = [];
    msgBroker.subscribe((msg, sender) => {
      this.receiveMessage(msg, sender);
    });
    await msgBroker.sendMessageToTab(tab.id, {
      command: 'collectPageDetails',
      tab: tab,
      sender: 'TabPopup',
    });
  }
  receiveMessage(msg, sender) {
    switch (msg.command) {
      case 'collectPageDetailsResponse':
        this.pageDetails.push({
          frameId: sender.frameId,
          tab: msg.tab,
          details: msg.details,
        });
        break;
    }
  }
  fillWithCred(cred) {
    var auto = new Autofill(this.pageDetails, this.tab);
    return auto.fillWithCred(cred);
  }
}

export default new TabData();
