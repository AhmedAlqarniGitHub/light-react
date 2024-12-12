import events from 'events';
import { client, xml } from '@xmpp/client';
import debug from '@xmpp/debug';
import pino from 'pino';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const STATUS = {
  AWAY: 'away',
  DND: 'busy',
  XA: 'away for long',
  ONLINE: 'online',
  OFFLINE: 'offline',
};

const eventList = {
  CONTACT_STATUS_CHANGED: 'CONTACT_STATUS_CHANGED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  VMSG: 'VMSG',
  CMSG: 'CMSG',
  PING: 'PING',
  ONLINE: 'online',
  OFFLINE: 'offline',
};

function bareJID(jid) {
  return jid ? jid.split('/')[0] : jid;
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

    // Add a unique resource to help avoid conflicts
    const uniqueResource = 'MsgClientOffice-' + Date.now();

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
    debug(this.xmpp, true); // Log traffic

    this.xmpp.on('online', async (address) => {
      this.currentUser = address.toString();
      console.log(`Connected as ${address}`);
      await this.getRoster();
      await this.xmpp.send(xml('presence'));
    });

    this.xmpp.on('error', (err) => {
      logger.error(`XMPP Error: ${err.message}`);
    });

    // Do NOT call this.offline() here to avoid triggering loops
    this.xmpp.on('offline', () => {
      logger.info('Offline event triggered by XMPP client.');
      // Just log offline; let the manager handle reconnection if needed
    });

    this.xmpp.on('stanza', (stanza) => {
      if (stanza.is('message')) {
        this.handleMessage(stanza);
      } else if (stanza.is('presence')) {
        this.handlePresence(stanza);
      } else {
        logger.warn(`Unknown stanza: ${stanza.toString()}`);
      }
    });
  }

  async connect() {
    try {
      await this.xmpp.start();
    } catch (err) {
      logger.error(`Failed to start XMPP client: ${err.message}`);
      throw new Error(err.message);
    }
  }

  // Remove the automatic calling of offline in the offline event.
  // This method can be manually invoked if needed when truly disconnecting.
  offline() {
    logger.debug('Sending unavailable presence and stopping XMPP.');
    this.xmpp.send(xml('presence', { type: 'unavailable' })).catch(() => {});
    this.xmpp.stop();
  }

  addEventListener(event, callback) {
    this.eventEmitter.on(event, callback);
  }

  emitEvent(event, data) {
    this.eventEmitter.emit(event, data);
  }

  async getRoster() {
    logger.info('Fetching roster...');
    const req = xml('query', 'jabber:iq:roster');
    const res = await this.xmpp.iqCaller.get(req).catch((err) => {
      logger.error(`Failed to fetch roster: ${err.message}`);
    });

    if (res) {
      this.contacts = res.getChildren('item').map((item) => ({
        jid: item.attrs.jid,
        name: item.attrs.name || item.attrs.jid,
        subscription: item.attrs.subscription,
        presence: STATUS.OFFLINE,
      }));

      console.log('Roster updated.');
      this.emitEvent(eventList.CONTACT_STATUS_CHANGED, this.contacts);
    }
  }

  handlePresence(stanza) {
    const from = stanza.attrs.from;
    const type = stanza.attrs.type;
    const contactJid = bareJID(from);

    logger.info(`Presence received from ${from}`);

    switch (type) {
      case 'subscribe':
        // Handle subscribe only if truly needed
        logger.info(`${from} requests presence subscription.`);
        this.acceptSubscription(contactJid);
        this.subscribe(contactJid);
        break;
      case 'unsubscribe':
        logger.info(`${from} unsubscribing from presence.`);
        this.cancelSubscription(contactJid);
        break;
      case 'subscribed':
        logger.info(`${from} allowed subscription.`);
        break;
      case 'unsubscribed':
        logger.info(`${from} denied/cancelled subscription.`);
        break;
      case 'unavailable':
        logger.info(`${from} went offline.`);
        this.setContactPresence(contactJid, STATUS.OFFLINE);
        break;
      default:
        if (contactJid !== bareJID(this.currentUser)) {
          logger.info(`${from} is now online.`);
          this.setContactPresence(contactJid, STATUS.ONLINE);
        }
        break;
    }
  }

  handleMessage(stanza) {
    const from = stanza.attrs.from;
    const body = stanza.getChildText('body');
    if (body) {
      logger.info(`Message received from ${from}: ${body}`);
      this.emitEvent(eventList.MESSAGE_RECEIVED, { from, body });
    }
  }

  setContactPresence(jid, presence) {
    const contact = this.contacts.find((c) => c.jid === jid);
    if (contact) {
      contact.presence = presence;
      // Emitting this event shouldn't cause reconnection logic in XmppManager
      this.emitEvent(eventList.CONTACT_STATUS_CHANGED, this.contacts);
    }
  }

  async sendMessage(to, body) {
    logger.info(`Sending message to ${to}: ${body}`);
    const msg = xml('message', { type: 'chat', to }, xml('body', {}, body));
    await this.xmpp.send(msg).catch((err) => {
      logger.error(`Failed to send message: ${err.message}`);
    });
  }

  async subscribe(jid) {
    if (!jid) return;
    logger.info(`Subscribing to ${jid}`);
    const stanza = xml('presence', { to: jid, type: 'subscribe' });
    await this.xmpp.send(stanza).catch((err) => logger.error(err));
  }

  async unsubscribe(jid) {
    if (!jid) return;
    logger.info(`Unsubscribing from ${jid}`);
    const stanza = xml('presence', { to: jid, type: 'unsubscribe' });
    await this.xmpp.send(stanza).catch((err) => logger.error(err));
  }

  async acceptSubscription(jid) {
    if (!jid) return;
    logger.info(`Accepting subscription from ${jid}`);
    const stanza = xml('presence', { to: jid, type: 'subscribed' });
    await this.xmpp.send(stanza).catch((err) => logger.error(err));
  }

  async cancelSubscription(jid) {
    if (!jid) return;
    logger.info(`Cancelling subscription from ${jid}`);
    const stanza = xml('presence', { to: jid, type: 'unsubscribed' });
    await this.xmpp.send(stanza).catch((err) => logger.error(err));
  }

  async addUser(jid, name) {
    if (!jid) return;
    logger.info(`Adding ${jid} to roster...`);
    const req = xml(
      'query',
      { xmlns: 'jabber:iq:roster' },
      xml('item', { jid, name: name || jid, subscription: 'none' })
    );

    const res = await this.xmpp.iqCaller.set(req).catch((err) => {
      logger.error(`Failed to add user ${jid}: ${err.message}`);
    });

    if (res) {
      logger.info(`${jid} added to roster.`);
      await this.getRoster();
      await this.subscribe(jid);
    }
  }

  async removeUser(jid) {
    if (!jid) return false;
    const contact = this.contacts.find((c) => c.jid === jid);
    if (!contact) return false;

    logger.info(`Removing ${jid} from roster.`);
    const req = xml(
      'query',
      { xmlns: 'jabber:iq:roster' },
      xml('item', { jid, subscription: 'remove' })
    );

    const res = await this.xmpp.iqCaller.set(req).catch((err) => {
      logger.error(`Failed to remove user ${jid}: ${err.message}`);
    });

    if (res) {
      logger.info(`${jid} removed from roster.`);
      await this.getRoster();
      return true;
    }
    return false;
  }

  async blockContact(jid) {
    logger.info(`Blocking contact ${jid}`);
  }

  async unblockContact(jid) {
    logger.info(`Unblocking contact ${jid}`);
  }
}

export { MsgXmppClient, eventList };
