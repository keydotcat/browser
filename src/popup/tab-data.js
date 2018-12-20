import msgQueue from '@/popup/services/message-queue';

class TabData {
  async loadData(tab) {
    this.tab = tab;
    this.details = {};
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
        this.details = msg.details;
        break;
    }
  }
}

export default new TabData();
