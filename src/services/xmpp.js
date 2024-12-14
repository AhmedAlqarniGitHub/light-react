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
    this.myProfile = {jid: username}

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
    window.xmpp = this
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
      } else if (stanza.is('iq')) {
				this.iqHandel(stanza);
			} else {
				logger.warn('unknown stanza:' + stanza.toString());
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
  
      // logger.info(`Presence updated for ${from}: ${contact.presence}`);
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

  async subscribed(jid) {
    const stanza = xml("presence", { to: jid, type: "subscribed" });
    await this.xmpp.send(stanza);
  }

/*********** vCard4 Retrieval ***********/

/**
 * Retrieve vCard4 information by sending an IQ-get.
 * @param {jid | null} jid - If null, retrieves the vCard4 for the current user.
 * @returns {Object | null} - Returns the parsed vCard4 or null if an error occurs.
 */
async getVCard(jid) {
  let para = {};

  if (!jid) {
    para = {
      from: this.currentUser,
      type: "get",
      id: "v1",
    };
  } else {
    para = {
      to: jid,
      type: "get",
      id: "v3",
    };
  }

  const vcardRequest = xml(
    'iq',
    para,
    xml('vcard', { xmlns: 'urn:ietf:params:xml:ns:vcard-4.0' })
  );

  try {
    const response = await this.xmpp.iqCaller.request(vcardRequest);
    const vcardElement = response.getChild('vcard', 'urn:ietf:params:xml:ns:vcard-4.0');
    if (!vcardElement) {
      logger.warn(`No vCard4 element found for ${jid || 'current user'}`);
      return null;
    }

    const vCard = {};
    vcardElement.children.forEach((child) => {
      if (child.is('fn')) {
        vCard.fullName = child.getChildText('text') || '';
      } else if (child.is('n')) {
        vCard.lastName = child.getChild('surname')?.getChildText('text') || '';
        vCard.firstName = child.getChild('given')?.getChildText('text') || '';
      } else if (child.is('org')) {
        vCard.organization = child.getChildText('text') || '';
      } else if (child.is('adr')) {
        vCard.country = child.getChild('country')?.getChildText('text') || '';
      } else if (child.is('note')) {
        vCard.description = child.getChildText('text') || '';
      } else {
        logger.debug(`Unhandled vCard4 field: ${child.name}`);
      }
    });

    if(!jid) {
      this.myProfile.fullName = vCard.fullName;
      this.myProfile.firstName = vCard.firstName;
      this.myProfile.lastName = vCard.lastName;
      this.myProfile.organization = vCard.organization;
      this.myProfile.country = vCard.country;
      this.myProfile.description = vCard.description;
    }

    logger.info(`vCard4 fetched for ${jid || 'current user'}: ${JSON.stringify(vCard)}`);
    return vCard;
  } catch (err) {
    logger.error(`Failed to fetch vCard4 for ${jid || 'current user'}: ${err.message}`);
    return null;
  }
}


async setVcard(firstname, lastname, company, country, description) {
  // Construct the vCard4 XML stanza
  const vCard = xml(
    'vcard',
    { xmlns: 'urn:ietf:params:xml:ns:vcard-4.0' },
    xml('fn', {},
      xml('text', {}, `${firstname} ${lastname}`)
    ),
    xml('n', {},
      xml('surname', {},
        xml('text', {}, lastname)
      ),
      xml('given', {},
        xml('text', {}, firstname)
      )
    ),
    xml('org', {},
      xml('text', {}, company)
    ),
    xml('adr', {},
      xml('country', {},
        xml('text', {}, country)
      )
    ),
    xml('note', {},
      xml('text', {}, description)
    )
  );

  try {
    // Send the IQ 'set' request with the vCard
    await this.xmpp.iqCaller.request(
      xml(
        'iq',
        { type: 'set' },
        vCard
      )
    );
    logger.log('vCard updated successfully.');
  } catch (err) {
    logger.error('Error updating vCard:', err);
  }
}


async iqHandel(stanza) {
  logger.debug(`received iq from ${stanza.attrs.from}`);
console.log(stanza.toString())
  logger.trace(stanza.toString());
}
  

async offline() {
  logger.info("Sending unavailable presence and disconnecting...");
  try {
    await this.xmpp.send(xml("presence", { type: "unavailable" }));
    await this.xmpp.stop();
    logger.info("Disconnected successfully.");
  } catch (err) {
    logger.error(`Error during disconnect: ${err.message}`);
  }
}


}

export { MsgXmppClient, eventList };
