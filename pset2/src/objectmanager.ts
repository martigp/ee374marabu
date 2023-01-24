import { db } from './store'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'
import { transactionManager } from './transactionmanager'
import * as obj from './application_objects/object'
import * as mess from './message'
import * as ed from '@noble/ed25519'
import { stringify } from 'querystring'


class ApplicationObjectManager {
  knownObjects: Map<String, obj.ApplicationObjectType> = new Map()

  async load() {
    try {
      this.knownObjects = new Map(await db.get('objects'))
      logger.debug(`Loaded known objects: ${[...this.knownObjects]}`)
    }
    catch {
      logger.info(`Initializing objects database`)
      this.knownObjects = new Map()
      await this.store()
    }
  }
  async store() {
    await db.put('objects', [...this.knownObjects])
  }

  onBlockObject(object : obj.BlockObjectType, args : any[]) {
    logger.debug(`Received Block object: ${args[0]}`);
  }

  onCoinbaseObject(object : obj.CoinbaseObjectType, args : any[]) {
    logger.debug(`Received Coinbase object: ${args[0]}`);
  }

  verify_sig(sig : string, noPubKeyTx : any, pubkey: string) : Promise<boolean> {
    let char_array : string[] = canonicalize(noPubKeyTx).split("");
    var hex_message = Uint8Array.from(char_array.map(x => x.charCodeAt(0)))
    return ed.verify(sig, hex_message, pubkey)
  }

  async onTxObject(object : obj.TxObjectType, args : any[0]) {
    let objectid = args[0];
    const noPubKeyTx = JSON.parse(JSON.stringify(object));
    for (const output of noPubKeyTx.outputs) {
      output.pubkey = null;
    }

    let sumInputs = 0;
    for(const input of object.inputs) {
      let storedInput = this.knownObjects.get(input.outpoint.txid);
      if(storedInput === undefined)
        // Return UKNOWN_OBJECT
        return;
      if(obj.TxObject.guard(storedInput)) {
        if (storedInput.outputs.length <= input.outpoint.index)
        // INVALID_TX_OUTPOINT
          return;
        let valid_sig : boolean = await this.verify_sig(input.sig, noPubKeyTx,
                    storedInput.outputs[input.outpoint.index].pubkey);

        if(!valid_sig)
          // Return INVALID_TX_SIGNATURE
          return;

        sumInputs += storedInput.outputs[input.outpoint.index].value;
      }
    }

    for(const output of object.outputs) {
      // Outputs contain public key and value
      //
    }

  }
  
  getObjectID(object: obj.ApplicationObjectType) : String { 
    const object_canon: string = canonicalize(object)
    logger.info(`Attempting to hash hashed from ${object_canon}`)
    var blake2 = require('blake2');
    var h = blake2.createHash('blake2s');
    h.update(Buffer.from(object_canon));
    var objectid = h.digest("hex")
    logger.info(`Attempting to hash hashed to ${objectid}`)
    return objectid; 
  }

  processObject(object : obj.ApplicationObjectType, objectid: String) {
    obj.ApplicationObject.match(
      this.onBlockObject.bind(this,[objectid])
      this.onTxObject.bind(this, [objectid]),
      this.onCoinbaseObject.bind(this, [objectid])
    )(object);
    this.objectDiscovered(object, objectid);

  }

  objectDiscovered(object: obj.ApplicationObjectType, objectid: String) {
    this.knownObjects.set(objectid, object); 
    this.store() 
    this.gossipObject(object, objectid);
  }

  gossipObject(object: obj.ApplicationObjectType, objectid: String ){ 
    for (const peerAddr of peerManager.knownPeers) {
        logger.info(`Attempting to gossip to peer: ${peerAddr} with objectid: ${objectid}`)
        try {
          const peer = new Peer(MessageSocket.createClient(peerAddr)) 
          peer.socket.on('handshake_complete', () => peer.sendIHaveObject(objectid));
        }
        catch (e: any) {
          logger.warn(`Failed to gossip to peer ${peerAddr}: ${e.message}`)
        }
        break;
    }
  }

}
export const objectManager = new ApplicationObjectManager()
