import { MsgXmppClient, eventList } from "./xmpp";

class XmppManager {
  constructor() {
    this.client = null;
    this.contactListeners = [];
    this.isConnected = false;
  }

  async connect(service, username, password) {
    if (!this.client) {
      this.client = new MsgXmppClient(service, username, password);

      // Handle contact updates
      this.client.addEventListener(eventList.CONTACT_STATUS_CHANGED, (contacts) => {
        this.updateContacts(contacts);
      });
    }

    if (!this.isConnected) {
      try {
        console.log("Connecting to XMPP server...");
        await this.client.connect();
        this.isConnected = true;

        // Fetch roster and probe presence after login
        await this.client.getRoster();
      } catch (error) {
        console.error("XMPP connection error:", error.message);
        throw error;
      }
    }
  }

  addEventListener(event, callback) {
    if (event === eventList.CONTACT_STATUS_CHANGED) {
      this.contactListeners.push(callback);
    } else if (this.client) {
      this.client.addEventListener(event, callback);
    }
  }

  updateContacts(contacts) {
    this.contactListeners.forEach((callback) => callback(contacts));
  }

  sendMessage(to, body) {
    if (this.client) {
      this.client.sendMessage(to, body);
    }
  }

  async addUser(jid, name) {
    if (this.client) {
      await this.client.addUser(jid, name);
    }
  }

  async removeUser(jid) {
    if (this.client) {
      await this.client.removeUser(jid);
    }
  }

  async blockContact(jid) {
    if (this.client) {
      await this.client.blockContact(jid);
    }
  }

  async unblockContact(jid) {
    if (this.client) {
      await this.client.unblockContact(jid);
    }
  }

async getVCard(jid) {
  if (this.client) {
    const vCard = await this.client.getVCard(jid);
    if (vCard) {
      // Update the contact in the local contacts list
      const contact = this.client.contacts.find((c) => c.jid === bareJID(jid));
      if (contact) {
        contact.firstName = vCard.firstName || "";
        contact.lastName = vCard.lastName || "";
        contact.photo = vCard.photo || "";
        this.updateContacts(this.client.contacts); // Notify listeners
      }
    }
    return vCard;
  }
  return null;
}

}

export default XmppManager;
export { eventList };
