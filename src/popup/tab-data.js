import msgQueue from '@/popup/services/message-queue';
import Autofill from '@/popup/autofill.js';

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
