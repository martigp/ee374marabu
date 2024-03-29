import { logger } from './logger'
import { MessageSocket } from './network'
import semver from 'semver'
import * as mes from './message'
import { peerManager } from './peermanager'
import { canonicalize } from 'json-canonicalize'
import { db, objectManager } from './object'
import { network } from './network'
import { ObjectId } from './object'
import { Block } from './block'
import { Transaction } from './transaction'
import { chainManager } from './chain'

const VERSION = '0.9.0'
const NAME = 'Malibu (pset3)'

// Number of peers that each peer is allowed to report to us
const MAX_PEERS_PER_PEER = 30

export class Peer {
  active: boolean = false
  socket: MessageSocket
  handshakeCompleted: boolean = false
  peerAddr: string

  async sendHello() {
    this.sendMessage({
      type: 'hello',
      version: VERSION,
      agent: NAME
    })
  }
  async sendGetPeers() {
    this.sendMessage({
      type: 'getpeers'
    })
  }
  async sendPeers() {
    this.sendMessage({
      type: 'peers',
      peers: [...peerManager.knownPeers]
    })
  }
  async sendIHaveObject(obj: any) {
    this.sendMessage({
      type: 'ihaveobject',
      objectid: objectManager.id(obj)
    })
  }
  async sendObject(obj: any) {
    this.sendMessage({
      type: 'object',
      object: obj
    })
  }
  async sendGetObject(objid: ObjectId) {
    this.sendMessage({
      type: 'getobject',
      objectid: objid
    })
  }
  async sendGetChainTip() {
    this.sendMessage({
      type: 'getchaintip'
    })
  }
  async sendChainTip(blockid: ObjectId) {
    this.sendMessage({
      type: 'chaintip',
      blockid: blockid
    })
  }
  async sendError(err: mes.AnnotatedError) {
    try {
      this.sendMessage(err.getJSON())
    } catch (error) {
      this.sendMessage(new mes.AnnotatedError('INTERNAL_ERROR', `Failed to serialize error message: ${error}`).getJSON())
    }
  }
  sendMessage(obj: object) {
    const message: string = canonicalize(obj)

    this.debug(`Sending message: ${message}`)
    this.socket.sendMessage(message)
  }
  async fatalError(err: mes.AnnotatedError) {
    await this.sendError(err)
    this.warn(`Peer error: ${err}`)
    this.fail()
  }
  async fail() {
    this.active = false
    this.socket.end()
    peerManager.peerFailed(this.peerAddr)
  }
  async onConnect() {
    this.active = true
    await this.sendHello()
    await this.sendGetPeers()
    await this.sendGetChainTip()
  }
  async onTimeout() {
    return await this.fatalError(new mes.AnnotatedError('INVALID_FORMAT', 'Timed out before message was complete'))
  }
  async onMessage(message: string) {
    this.debug(`Message arrival: ${message}`)

    let msg: object

    try {
      msg = JSON.parse(message)
      this.debug(`Parsed message into: ${JSON.stringify(msg)}`)
    }
    catch {
      return await this.fatalError(new mes.AnnotatedError('INVALID_FORMAT', `Failed to parse incoming message as JSON: ${message}`))
    }
    if (!mes.Message.guard(msg)) {
      const validation = mes.Message.validate(msg)
      return await this.fatalError(new mes.AnnotatedError(
        'INVALID_FORMAT', 
        `The received message does not match one of the known message formats: ${message}
         Validation error: ${JSON.stringify(validation)}`
      )
      )
    }
    if (!this.handshakeCompleted) {
      if (mes.HelloMessage.guard(msg)) {
        return this.onMessageHello(msg)
      }
      return await this.fatalError(new mes.AnnotatedError('INVALID_HANDSHAKE', `Received message ${message} prior to "hello"`))
    }
    mes.Message.match(
      async () => {
        return await this.fatalError(new mes.AnnotatedError('INVALID_HANDSHAKE', `Received a second "hello" message, even though handshake is completed`))
      },
      this.onMessageGetPeers.bind(this),
      this.onMessagePeers.bind(this),
      this.onMessageIHaveObject.bind(this),
      this.onMessageGetObject.bind(this),
      this.onMessageObject.bind(this),
      this.onMessageGetChainTip.bind(this),
      this.onMessageChainTip.bind(this),
      this.onMessageError.bind(this)
    )(msg)
  }
  async onMessageHello(msg: mes.HelloMessageType) {
    if (!semver.satisfies(msg.version, `^${VERSION}`)) {
      return await this.fatalError(new mes.AnnotatedError('INVALID_FORMAT', `You sent an incorrect version (${msg.version}), which is not compatible with this node's version ${VERSION}.`))
    }
    this.info(`Handshake completed. Remote peer running ${msg.agent} at protocol version ${msg.version}`)
    this.handshakeCompleted = true
  }
  async onMessagePeers(msg: mes.PeersMessageType) {
    for (const peer of msg.peers.slice(0, MAX_PEERS_PER_PEER)) {
      this.info(`Remote party reports knowledge of peer ${peer}`)

      peerManager.peerDiscovered(peer)
    }
    if (msg.peers.length > MAX_PEERS_PER_PEER) {
      this.info(`Remote party reported ${msg.peers.length} peers, but we processed only ${MAX_PEERS_PER_PEER} of them.`)
    }
  }
  async onMessageGetPeers(msg: mes.GetPeersMessageType) {
    this.info(`Remote party is requesting peers. Sharing.`)
    await this.sendPeers()
  }
  async onMessageIHaveObject(msg: mes.IHaveObjectMessageType) {
    this.info(`Peer claims knowledge of: ${msg.objectid}`)

    if (!await db.exists(msg.objectid)) {
      this.info(`Object ${msg.objectid} discovered`)
      await this.sendGetObject(msg.objectid)
    }
  }
  async onMessageGetObject(msg: mes.GetObjectMessageType) {
    this.info(`Peer requested object with id: ${msg.objectid}`)

    let obj
    try {
      obj = await objectManager.get(msg.objectid)
    }
    catch (e) {
      this.warn(`We don't have the requested object with id: ${msg.objectid}`)
      this.sendError(new mes.AnnotatedError('UNKNOWN_OBJECT', `Unknown object with id ${msg.objectid}`))
      return
    }
    await this.sendObject(obj)
  }
  async onMessageObject(msg: mes.ObjectMessageType) {
    const objectid: ObjectId = objectManager.id(msg.object)
    let known: boolean = false

    this.info(`Received object with id ${objectid}: %o`, msg.object)

    known = await objectManager.exists(objectid)

    if (known) {
      this.debug(`Object with id ${objectid} is already known`)
    }
    else {
      this.info(`New object with id ${objectid} downloaded: %o`, msg.object)

      // store object even if it is invalid
      await objectManager.put(msg.object)
    }

    let instance: Block | Transaction;
    try {
      instance = await objectManager.validate(msg.object, this)
    }
    catch (e: any) {
      this.sendError(e)
      return
    }

    if (!known) {
      // gossip
      network.broadcast({
        type: 'ihaveobject',
        objectid
      })
    }
  }

  async onMessageGetChainTip(msg: mes.GetChainTipMessageType) {
    this.sendChainTip(chainManager.blockid)
  }

  async onMessageChainTip(msg: mes.ChainTipMessageType) {
    /* Handle all this in block, all need to do is if it exists */
    try {
      await objectManager.retrieve(msg.blockid, this)
    }
    catch(e) {
      return
    }
  }

  async onMessageError(msg: mes.ErrorMessageType) {
    this.warn(`Peer reported error: ${msg.name}`)
  }
  log(level: string, message: string, ...args: any[]) {
    logger.log(
      level,
      `[peer ${this.socket.peerAddr}:${this.socket.netSocket.remotePort}] ${message}`,
      ...args
    )
  }
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }
  constructor(socket: MessageSocket, peerAddr: string) {
    this.socket = socket
    this.peerAddr = peerAddr

    socket.netSocket.on('connect', this.onConnect.bind(this))
    socket.netSocket.on('error', err => {
      this.warn(`Socket error: ${err}`)
      this.fail()
    })
    socket.on('message', this.onMessage.bind(this))
    socket.on('timeout', this.onTimeout.bind(this))
  }
}
