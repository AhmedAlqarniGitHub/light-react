import { MsgXmppClient, eventList } from "./xmpp";

class XmppManager {
  constructor() {
    this.client = null;
    this.contactListeners = []; // Maintain custom listeners for contact updates
    this.isConnected = false; // Track connection status
  }

  async connect(service, username, password) {
    // Prevent creating multiple connections
    if (this.isConnected) {
      console.log("Already connected to the XMPP server.");
      return;
    }

    if (!this.client) {
      this.client = new MsgXmppClient(service, username, password);

      // Listen for contact changes and handle them directly
      this.client.addEventListener(eventList.CONTACT_STATUS_CHANGED, (contacts) => {
        this.updateContacts(contacts);
      });

      // Mark as disconnected when the client goes offline
      this.client.addEventListener("offline", () => {
        this.isConnected = false;
        console.log("Disconnected from XMPP server.");
      });
    }

    try {
      console.log("Connecting to XMPP server...");
      await this.client.connect();
      this.isConnected = true;
      console.log("XMPP connection established successfully.");
    } catch (error) {
      console.error("XMPP connection error:", error.message);
      if (error.message.includes("not-authorized")) {
        throw new Error("not-authorized");
      } else {
        throw new Error("connection-failed");
      }
    }
  }

  addEventListener(event, callback) {
    if (event === eventList.CONTACT_STATUS_CHANGED) {
      this.contactListeners.push(callback); // Track listeners for contacts
    } else if (this.client) {
      this.client.addEventListener(event, callback);
    }
  }

  updateContacts(contacts) {
    console.log("Contacts updated:", contacts);
    // Notify all registered listeners for contacts
    this.contactListeners.forEach((callback) => callback(contacts));
  }

  sendMessage(to, body) {
    if (this.client) {
      this.client.sendMessage(to, body);
    }
  }

  blockContact(jid) {
    if (this.client) {
      this.client.blockContact(jid);
    }
  }

  unblockContact(jid) {
    if (this.client) {
      this.client.unblockContact(jid);
    }
  }
}

export default XmppManager;
