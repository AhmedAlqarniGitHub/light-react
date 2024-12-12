import { MsgXmppClient, eventList } from "./xmpp";

class XmppManager {
  constructor() {
    this.client = null;
    this.contactListeners = [];
    this.messageListeners = [];
    this.isConnected = false;
    this.connecting = false; // Flag to prevent multiple simultaneous connection attempts
  }

  async connect(service, username, password) {
    if (this.isConnected) {
      console.log("Already connected to the XMPP server. Skipping re-connect.");
      return;
    }

    if (this.connecting) {
      console.log("Connection attempt already in progress. Please wait.");
      return;
    }

    if (!this.client) {
      this.client = new MsgXmppClient(service, username, password);

      this.client.addEventListener(eventList.CONTACT_STATUS_CHANGED, (contacts) => {
        this.updateContacts(contacts);
      });

      this.client.addEventListener(eventList.MESSAGE_RECEIVED, (message) => {
        this.updateMessages(message);
      });

      this.client.addEventListener("offline", () => {
        this.isConnected = false;
        this.connecting = false;
        console.log("Disconnected from XMPP server.");
      });
    }

    this.connecting = true;

    try {
      console.log("Connecting to XMPP server...");
      await this.client.connect();
      this.isConnected = true;
      this.connecting = false;
      console.log("XMPP connection established successfully.");
    } catch (error) {
      this.connecting = false;
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
      this.contactListeners.push(callback);
    } else if (event === eventList.MESSAGE_RECEIVED) {
      this.messageListeners.push(callback);
    } else if (this.client) {
      this.client.addEventListener(event, callback);
    }
  }

  updateContacts(contacts) {
    console.log("Contacts updated:", contacts);
    this.contactListeners.forEach((callback) => callback(contacts));
  }

  updateMessages(message) {
    console.log("Message received:", message);
    this.messageListeners.forEach((callback) => callback(message));
  }

  sendMessage(to, body) {
    if (this.client && this.isConnected) {
      this.client.sendMessage(to, body);
    } else {
      console.warn("Cannot send message: Not connected.");
    }
  }

  addUser(jid, name) {
    if (this.client && this.isConnected) {
      this.client.addUser(jid, name);
    } else {
      console.warn("Cannot add user: Not connected.");
    }
  }

  removeUser(jid) {
    if (this.client && this.isConnected) {
      this.client.removeUser(jid);
    } else {
      console.warn("Cannot remove user: Not connected.");
    }
  }

  blockContact(jid) {
    if (this.client && this.isConnected) {
      this.client.blockContact(jid);
    } else {
      console.warn("Cannot block user: Not connected.");
    }
  }

  unblockContact(jid) {
    if (this.client && this.isConnected) {
      this.client.unblockContact(jid);
    } else {
      console.warn("Cannot unblock user: Not connected.");
    }
  }
}

export default XmppManager;
export { eventList };
