import { db } from './store'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'
import { transactionManager } from './transactionmanager'
import { ApplicationObject, ApplicationObjectType } from './application_objects/object'
import * as mess from './message'


class ApplicationObjectManager {
  knownObjects: Map<String, ApplicationObjectType> = new Map()

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
  
  getObjectID(object: ApplicationObjectType) : String { 
    const object_canon: string = canonicalize(object)
    logger.info(`Attempting to hash hashed from ${object_canon}`)
    var blake2 = require('blake2');
    var h = blake2.createHash('blake2s');
    h.update(Buffer.from(object_canon));
    var objectid = h.digest("hex")
    logger.info(`Attempting to hash hashed to ${objectid}`)
    return objectid; 
  }

   objectDiscovered(object: ApplicationObjectType, objectid: String) {
    this.knownObjects.set(objectid, object); 
    this.store() 
    this.gossipObject(object, objectid);
    }

  gossipObject(object: ApplicationObjectType, objectid: String ){ 
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
