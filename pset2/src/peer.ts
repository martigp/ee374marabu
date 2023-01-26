import { logger } from './logger'
import { MessageSocket } from './network'
import semver from 'semver'
import * as mess from './message'
import { peerManager } from './peermanager'
import { canonicalize } from 'json-canonicalize'
import { objectManager } from './objectmanager'
import * as obj from './application_objects/object'
import * as ed from '@noble/ed25519'
import { Union } from 'runtypes'

const VERSION = '0.9.0'
const NAME = 'Gordon & Mapau'

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

  async sendGetObject(objectid: String) {
    this.sendMessage({
      type: 'getobject', 
      objectid: objectid
    })
  }
  async sendObject(objectid: String) {
    this.sendMessage({
      type: 'object',
      object: objectManager.knownObjects.get(objectid)
    })
  }
  async sendIHaveObject(objectid: String) {
    this.sendMessage({
      type: 'ihaveobject',
      objectid: objectid 
    })
  }

  async sendError(err: mess.AnnotatedError) {
    try {
      this.sendMessage(err.getJSON())
    } catch (error) {
      this.sendMessage(new mess.AnnotatedError('INTERNAL_ERROR', `Failed to serialize error message: ${error}`).getJSON())
    }
  }

  sendMessage(obj: object) {
    const message: string = canonicalize(obj)

    this.debug(`Sending message: ${message}`)
    this.socket.sendMessage(message)
  }
  async fatalError(err: mess.AnnotatedError) {
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
    return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', 'Timed out before message was complete'))
  }
  async onMessage(message: string) {

    this.debug(`Message arrival: ${message}`)

    let msg: object

    try {
      msg = JSON.parse(message)
      this.debug(`Parsed message into: ${JSON.stringify(msg)}`)
    }
    catch {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', `Failed to parse incoming message as JSON: ${message}`))
    }
    if (!mess.Message.guard(msg)) {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', `The received message does not match one of the known message formats: ${message}`))
    }
    if (!this.handshakeCompleted) {
      if (mess.HelloMessage.guard(msg)) {
        return this.onMessageHello(msg)
      }
      return await this.fatalError(new mess.AnnotatedError('INVALID_HANDSHAKE', `Received message ${message} prior to "hello"`))
    }

    mess.Message.match(
      async () => {
        return await this.fatalError(new mess.AnnotatedError('INVALID_HANDSHAKE', `Received a second "hello" message, even though handshake is completed`))
      },
      this.onMessageGetPeers.bind(this),
      this.onMessagePeers.bind(this),
      this.onMessageError.bind(this),
      this.onMessageIHaveObject.bind(this),
      this.onMessageGetObject.bind(this), 
      this.onMessageObject.bind(this), 
    )(msg)
  }

  async onMessageHello(msg: mess.HelloMessageType) {
    if (!/0\.9\.0/.test(msg.version)) {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', `You sent an incorrect version (${msg.version}), which is not compatible with this node's version ${VERSION}.`))
    }
    this.info(`Handshake completed. Remote peer running ${msg.agent} at protocol version ${msg.version}`)
    this.handshakeCompleted = true;
    this.socket.emit('handshake_complete');
  }
  async onMessagePeers(msg: mess.PeersMessageType) {
    for (const peer of msg.peers) {
      //this.info(`Remote party reports knowledge of peer ${peer}`)
      peerManager.peerDiscovered(peer)
    }
  }

  async onMessageGetPeers(msg: mess.GetPeersMessageType) {
    this.info(`Remote party is requesting peers. Sharing.`)
    await this.sendPeers()
  }

  async onMessageGetObject(msg: mess.GetObjectMessageType) {
    this.info(`Remote party is requesting object with ID ${msg.objectid}.`)
    if (!obj.checkValidObjectId(msg.objectid)) {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', `Invalid blake2 hash for objectid`));
    }
    if(objectManager.knownObjects.has(msg.objectid)){
      this.info(`I have object with ID ${msg.objectid}. Sharing`)
      await this.sendObject(msg.objectid)
    }
    else{ 
      this.info(`I don't have object with ID ${msg.objectid}`)
    }
  }

  async onMessageIHaveObject(msg: mess.IHaveObjectMessageType) {
    this.info(`Remote party is reporting knowledge of an object with ID ${msg.objectid}`);
    if (!obj.checkValidObjectId(msg.objectid)) {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT', `Invalid objectid ${msg.objectid}`));
    }
    if(!objectManager.knownObjects.has(msg.objectid)){ 
      this.info(`I dont have object with ID ${msg.objectid}. Requesting from remote party`)
      await this.sendGetObject(msg.objectid)
    }
    else{ 
      this.info(`I already have object with ID ${msg.objectid}`)
    }
  }

  async onMessageObject(msg: mess.ObjectMessageType) {
    this.info(`Remote party is sending object: ${canonicalize(msg.object)}`)
    let objectid: String = objectManager.getObjectID(msg.object)
    if(!objectManager.knownObjects.has(objectid)){
      obj.ApplicationObject.match(
        (block : obj.BlockObjectType) => this.onBlockObject(block, objectid), 
        (tx : obj.TxObjectType) => this.onTxObject(tx, objectid),
        (coinbase : obj.CoinbaseObjectType) => this.onCoinbaseObject(coinbase, objectid),
      )(msg.object);
    }
    else{ 
      this.info(`I already had object with ID : ${objectid}. Ignored`)
    }
  }

  onBlockObject(object : obj.BlockObjectType, objectid : String) {
    logger.debug(`Received Block object: ${canonicalize(object)}`);
    objectManager.objectDiscovered(object, objectid);
    this.socket.emit('gossip', {
      type: 'ihaveobject',
      objectid: objectid 
    });
  }

  onCoinbaseObject(object : obj.CoinbaseObjectType, objectid : String) {
    logger.debug(`Received Coinbase object:  ${canonicalize(object)}`);
    objectManager.objectDiscovered(object, objectid);
    this.socket.emit('gossip', {
      type: 'ihaveobject',
      objectid: objectid 
    });
  }

  verify_sig(sig : string, noSigTx : any, pubkey: string) : Promise<boolean> {
    let char_array : string[] = canonicalize(noSigTx).split("");
    var hex_message = Uint8Array.from(char_array.map(x => x.charCodeAt(0)))
    return ed.verify(sig, hex_message, pubkey)
  }

  async onTxObject(object : obj.TxObjectType, objectid : String) {

    if(!obj.validTxFormat(object)) {
      return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT',
                          `Transcation Object had invalid format`));
    }

    // Get Tx with nullified pubkeys for signature validation
    const noSigTx = JSON.parse(JSON.stringify(object))
    for (const input of noSigTx.inputs) {
      // Check for null signatures
      if (input.sig === null) {
        return await this.sendError(new mess.AnnotatedError('INVALID_TX_SIGNATURE',
                                          `Signature null on an input`));
      }
      input.sig = null;
    }

    let sumInputs = 0;
    let inputNo = 0;
    logger.debug(`The inputs ${canonicalize(object.inputs)}`)
    for(const input of object.inputs) {

      let res = objectManager.getObject(input.outpoint.txid)
      if(!res.success) {
        return await this.sendError(new mess.AnnotatedError('UNKNOWN_OBJECT',
        `Input Objectid ${input.outpoint.txid} not found locally`));
      }
      let prevTx = res.object;
      logger.debug(`Stored boject ${canonicalize(prevTx)}`)
      if(Union(obj.TxObject, obj.CoinbaseObject).guard(prevTx)) {
        let ind = input.outpoint.index;
        if (prevTx.outputs.length <= ind)
          return await this.sendError(new mess.AnnotatedError('INVALID_TX_OUTPOINT',
                                          `Index ${input.outpoint.index} too large`));

        // Shows error here but isn't an issue because we verify above that 
        // all signatures are non null.
        let valid_sig : boolean = false;
        if (input.sig) {
          valid_sig = await this.verify_sig(input.sig, noSigTx,
            prevTx.outputs[input.outpoint.index].pubkey);
        }
        if(!valid_sig) {
          return await this.sendError(new mess.AnnotatedError('INVALID_TX_SIGNATURE',
                                          `Bad sig on ${canonicalize(noSigTx)}`));
        }

        let val = prevTx.outputs[input.outpoint.index].value;
      
        sumInputs += val
        logger.debug(`Input with value ${prevTx.outputs[input.outpoint.index].value} verified`)
      }
      inputNo += 1;
    }
    
    logger.debug(`Valid inputs`);

    let sumOutputs = 0;
    let outputNo = 0;
    for(const output of object.outputs) {
      if (output.value < 0) {
        return await this.fatalError(new mess.AnnotatedError('INVALID_FORMAT',
                                          `${output.value} less than zero on output ${outputNo}`));
      }
      sumOutputs += output.value;
      outputNo += 1;
    }

    if (sumInputs < sumOutputs)
      return await this.sendError(new mess.AnnotatedError('INVALID_TX_CONSERVATION',`, Inputs: ${sumInputs}, Outputs: ${sumOutputs}`));
    
    objectManager.objectDiscovered(object, objectid);
    this.socket.emit('gossip', {
      type: 'ihaveobject',
      objectid: objectid 
    });
  }

  async onMessageError(msg: mess.ErrorMessageType) {
    this.warn(`Peer reported error: ${msg.name}`)
  }
  log(level: string, message: string) {
    logger.log(level, `[peer ${this.socket.peerAddr}] ${message}`)
  }
  warn(message: string) {
    this.log('warn', message)
  }
  info(message: string) {
    this.log('info', message)
  }
  debug(message: string) {
    this.log('debug', message)
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
