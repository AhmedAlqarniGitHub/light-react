import events from "events";
import { client, xml } from "@xmpp/client";
import debug from "@xmpp/debug";
import pino from "pino";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const STATUS = {
  AWAY: "away",
  DND: "busy",
  XA: "away for long",
  ONLINE: "online",
  OFFLINE: "offline",
  UNKNOWN: "unknown",
};

const eventList = {
  CONTACT_STATUS_CHANGED: "CONTACT_STATUS_CHANGED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
};

function bareJID(jid) {
  return jid ? jid.split("/")[0] : jid;
}

class MsgXmppClient {
  #service;
  #username;
  #password;

  contacts = [];

  constructor(service, username, password) {
    this.#service = service;
    this.#username = username;
    this.#password = password;

    const uniqueResource = `MsgClientOffice-${Date.now()}`;
    this.xmpp = client({
      service: this.#service,
      username: this.#username,
      password: this.#password,
      resource: uniqueResource,
    });

    debug(this.xmpp, true);
    this.eventEmitter = new events.EventEmitter();
    this.currentUser = null;

    this.initializeXmppHandlers();
  }

  initializeXmppHandlers() {
    debug(this.xmpp, true);

    this.xmpp.on("online", async (address) => {
      this.currentUser = address.toString();
      console.log(`Connected as ${address}`);
      await this.getRoster();
      await this.xmpp.send(xml("presence"));
    });

    this.xmpp.on("error", (err) => {
      logger.error(`XMPP Error: ${err.message}`);
    });

    this.xmpp.on("stanza", (stanza) => {
      if (stanza.is("message")) {
        this.handleMessage(stanza);
      } else if (stanza.is("presence")) {
        this.handlePresence(stanza);
      }
    });
  }

  async connect() {
    try {
      await this.xmpp.start();
    } catch (err) {
      logger.error(`Failed to start XMPP client: ${err.message}`);
      throw err;
    }
  }

  addEventListener(event, callback) {
    this.eventEmitter.on(event, callback);
  }

  emitEvent(event, data) {
    this.eventEmitter.emit(event, data);
  }

  async getRoster() {
    logger.info("Fetching roster...");
    const req = xml("query", "jabber:iq:roster");
    const res = await this.xmpp.iqCaller.get(req).catch((err) => {
      logger.error(`Failed to fetch roster: ${err.message}`);
    });

    if (res) {
      this.contacts = res.getChildren("item").map((item) => ({
        jid: item.attrs.jid,
        name: item.attrs.name || item.attrs.jid,
        subscription: item.attrs.subscription,
        presence: STATUS.UNKNOWN, // Initialize presence
      }));

      this.emitEvent(eventList.CONTACT_STATUS_CHANGED, this.contacts);

      // Probe presence for all contacts
      await this.updateContactStatuses();
    }
  }

  async updateContactStatuses() {
    for (const contact of this.contacts) {
      await this.probePresence(contact.jid);
    }
  }

  async probePresence(jid) {
    const presenceProbe = xml("presence", { to: jid, type: "probe" });
    await this.xmpp.send(presenceProbe).catch((err) => {
      logger.error(`Failed to probe presence for ${jid}: ${err.message}`);
    });
  }

  handlePresence(stanza) {
    const from = bareJID(stanza.attrs.from);
    const type = stanza.attrs.type || "available"; // Default to available
    const show = stanza.getChildText("show"); // Presence subtype
    const presenceStatus = show ? STATUS[show.toUpperCase()] || STATUS.ONLINE : STATUS.ONLINE;
  
    // Find the contact in the roster
    const contact = this.contacts.find((c) => c.jid === from);
  
    if (contact) {
      // Update the presence only if the contact exists
      contact.presence = type === "unavailable" ? STATUS.OFFLINE : presenceStatus;
  
      // Emit the updated contacts list
      this.emitEvent(eventList.CONTACT_STATUS_CHANGED, this.contacts);
  
      logger.info(`Presence updated for ${from}: ${contact.presence}`);
    } else {
      // Log a warning for unknown presence updates
      logger.warn(`Received presence for unknown contact: ${from}`);
    }
  }
  

  handleMessage(stanza) {
    const from = stanza.attrs.from;
    const body = stanza.getChildText("body");
    if (body) {
      this.emitEvent(eventList.MESSAGE_RECEIVED, { from, body });
    }
  }

  async sendMessage(to, body) {
    const msg = xml("message", { type: "chat", to }, xml("body", {}, body));
    await this.xmpp.send(msg).catch((err) => {
      logger.error(`Failed to send message: ${err.message}`);
    });
  }

  async addUser(jid, name) {
    const req = xml(
      "query",
      { xmlns: "jabber:iq:roster" },
      xml("item", { jid, name: name || jid })
    );
    await this.xmpp.iqCaller.set(req);
    this.getRoster();
    await this.subscribe(jid);
  }

  async removeUser(jid) {
    const req = xml(
      "query",
      { xmlns: "jabber:iq:roster" },
      xml("item", { jid, subscription: "remove" })
    );
    await this.xmpp.iqCaller.set(req);
    this.getRoster();
  }

  async subscribe(jid) {
    const stanza = xml("presence", { to: jid, type: "subscribe" });
    await this.xmpp.send(stanza);
  }
}

export { MsgXmppClient, eventList };
