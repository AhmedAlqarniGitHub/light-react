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
  VMSG: 'VMSG',
  CMSG: 'CMSG',
  PING: 'PING',
  ONLINE: 'online',
  OFFLINE: 'offline',
};

class MsgXmppClient {
  #service;
  #username;
  #password;

  contacts = [];

  constructor(service, username, password) {
    this.#service = service;
    this.#username = username;
    this.#password = password;

    this.xmpp = client({
      service: this.#service,
      username: this.#username,
      password: this.#password,
     resource: 'MsgClientOffice',
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

    this.xmpp.on('offline', () => {
      logger.info('Offline');
      this.offline();
    });

    this.xmpp.on('stanza', (stanza) => {
      if (stanza.is('message')) this.handleMessage(stanza);
      else if (stanza.is('presence')) this.handlePresence(stanza);
      else logger.warn(`Unknown stanza: ${stanza.toString()}`);
    });
  }

  async connect() {
    try {
      await this.xmpp.start();
    } catch (err) {
      logger.error(`Failed to start XMPP client: ${err.message}`);
      throw new Error(err.message); // Re-throw the error to the caller
    }
  }
  

  offline() {
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
      this.contacts = res
        .getChildren('item')
        .map((item) => ({
          jid: item.attrs.jid,
          name: item.attrs.name || item.attrs.jid,
          subscription: item.attrs.subscription,
        }));

      console.log('Roster updated.sss');
      this.emitEvent(eventList.CONTACT_STATUS_CHANGED, this.contacts);
    }
  }

  handlePresence(stanza) {
    logger.info(`Presence received from ${stanza.attrs.from}`);
  }

  handleMessage(stanza) {
    const from = stanza.attrs.from;
    const body = stanza.getChildText('body');
    if (body) {
      logger.info(`Message received from ${from}: ${body}`);
      this.emitEvent(eventList.MESSAGE_RECEIVED, { from, body });
    }
  }

  async sendMessage(to, body) {
    logger.info(`Sending message to ${to}: ${body}`);
    const msg = xml('message', { type: 'chat', to }, xml('body', {}, body));
    await this.xmpp.send(msg).catch((err) => {
      logger.error(`Failed to send message: ${err.message}`);
    });
  }

  async blockContact(jid) {
    logger.info(`Blocking contact ${jid}`);
  }

  async unblockContact(jid) {
    logger.info(`Unblocking contact ${jid}`);
  }
}

export { MsgXmppClient, eventList };
