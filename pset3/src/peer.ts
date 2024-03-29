import { logger } from './logger'
import { MessageSocket } from './network'
import semver from 'semver'
import { AnnotatedError,
         Message,
         HelloMessage,
         HelloMessageType,
         PeersMessageType, GetPeersMessageType,
         IHaveObjectMessageType, GetObjectMessageType, ObjectMessageType,
         ErrorMessageType } from './message'
import { peerManager } from './peermanager'
import { canonicalize } from 'json-canonicalize'
import { db, ObjectStatus, ObjectStorage } from './store'
import { network } from './network'
import { ObjectId } from './store'

const VERSION = '0.9.0'
const NAME = 'Malibu (pset2)'

export class Peer {
  active: boolean = false
  socket: MessageSocket
  handshakeCompleted: boolean = false

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
      objectid: ObjectStorage.id(obj)
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
  async sendError(err: AnnotatedError) {
    try {
      this.sendMessage(err.getJSON())
    } catch (error) {
      this.sendMessage(new AnnotatedError('INTERNAL_ERROR', `Failed to serialize error message: ${error}`).getJSON())
    }
  }
  sendMessage(obj: object) {
    const message: string = canonicalize(obj)

    this.debug(`Sending message: ${message}`)
    this.socket.sendMessage(message)
  }
  async fatalError(err: AnnotatedError) {
    await this.sendError(err)
    this.warn(`Peer error: ${err}`)
    this.active = false
    this.socket.end()
  }
  async onConnect() {
    this.active = true
    await this.sendHello()
    await this.sendGetPeers()
  }
  async onTimeout() {
    return await this.fatalError(new AnnotatedError('INVALID_FORMAT', 'Timed out before message was complete'))
  }
  async onMessage(message: string) {
    this.debug(`Message arrival: ${message}`)

    let msg: object

    try {
      msg = JSON.parse(message)
      this.debug(`Parsed message into: ${JSON.stringify(msg)}`)
    } catch {
      return await this.fatalError(new AnnotatedError('INVALID_FORMAT', `Failed to parse incoming message as JSON: ${message}`))
    }
    if (!Message.guard(msg)) {
      const validation = Message.validate(msg)
      return await this.fatalError(new AnnotatedError(
        'INVALID_FORMAT', 
        `The received message does not match one of the known message formats: ${message}
         Validation error: ${JSON.stringify(validation)}`
      ))
    }
    if (!this.handshakeCompleted) {
      if (HelloMessage.guard(msg)) {
        return this.onMessageHello(msg)
      }
      return await this.fatalError(new AnnotatedError('INVALID_HANDSHAKE', `Received message ${message} prior to "hello"`))
    }
    Message.match(
      async () => {
        return await this.fatalError(new AnnotatedError('INVALID_HANDSHAKE', `Received a second "hello" message, even though handshake is completed`))
      },
      this.onMessageGetPeers.bind(this),
      this.onMessagePeers.bind(this),
      this.onMessageIHaveObject.bind(this),
      this.onMessageGetObject.bind(this),
      this.onMessageObject.bind(this),
      this.onMessageError.bind(this)
    )(msg)
  }
  async onMessageHello(msg: HelloMessageType) {
    if (!semver.satisfies(msg.version, `^${VERSION}`)) {
      return await this.fatalError(new AnnotatedError('INVALID_FORMAT', `You sent an incorrect version (${msg.version}), which is not compatible with this node's version ${VERSION}.`))
    }
    this.info(`Handshake completed. Remote peer running ${msg.agent} at protocol version ${msg.version}`)
    this.handshakeCompleted = true
  }
  async onMessagePeers(msg: PeersMessageType) {
    for (const peer of msg.peers) {
      this.info(`Remote party reports knowledge of peer ${peer}`)

      peerManager.peerDiscovered(peer)
    }
  }
  async onMessageGetPeers(msg: GetPeersMessageType) {
    this.info(`Remote party is requesting peers. Sharing.`)
    await this.sendPeers()
  }
  async onMessageIHaveObject(msg: IHaveObjectMessageType) {
    this.info(`Peer claims knowledge of: ${msg.objectid}`)

    if (!await db.exists(msg.objectid)) {
      this.info(`Object ${msg.objectid} discovered`)
      await this.sendGetObject(msg.objectid)
    }
  }
  async onMessageGetObject(msg: GetObjectMessageType) {
    this.info(`Peer requested object with id: ${msg.objectid}`)

    let obj
    try {
      obj = await ObjectStorage.get(msg.objectid)
    } catch {
      this.warn(`We don't have the requested object with id: ${msg.objectid}`)
      this.sendError(new AnnotatedError('UNKNOWN_OBJECT', `Unknown object with id ${msg.objectid}`))
      return
    }
    await this.sendObject(obj)
  }
  async onMessageObject(msg: ObjectMessageType) {
    const objectid: ObjectId = ObjectStorage.id(msg.object)

    this.info(`Received object with id ${objectid}: %o`, msg.object)

    if (await ObjectStorage.exists(objectid)) {
      this.debug(`Object with id ${objectid} is already known`)
      return
    }
    this.info(`New object with id ${objectid} downloaded: %o`, msg.object)

    try {
      await ObjectStorage.validate(msg.object)
    }
    catch (e: any) {
      // TODO: Shouldn't this destroy connection if it is INVALID_FORMAT
      this.sendError(e)
      return
    }

    await ObjectStorage.put(msg.object)
    network.emit(objectid, ObjectStatus.AddedToDb)
    // gossip
    network.broadcast({
      type: 'ihaveobject',
      objectid: objectid
    })
  }
  async onMessageError(msg: ErrorMessageType) {
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
  constructor(socket: MessageSocket) {
    this.socket = socket

    socket.netSocket.on('connect', this.onConnect.bind(this))
    socket.netSocket.on('error', err => {
      this.warn(`Socket error: ${err}`)
    })
    socket.on('message', this.onMessage.bind(this))
    socket.on('timeout', this.onTimeout.bind(this))
  }
}
