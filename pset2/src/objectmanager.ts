import { db } from './store'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'


class ObjectManager {
  knownObjects: Map<String, object> = new Map()

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
  
  getObjectID(object: object){ 
    const object_canon: string = canonicalize(object)
    var blake2 = require('blake2');
    logger.info(`Attempting to hash hashed from ${object_canon}`)
    var objectid = blake2.createHash('blake2s', Buffer.from(object_canon));
    logger.info(`Attempting to hash hashed to ${objectid}`)

    return objectid; 
  }
  objectDiscovered(object: Object, objectid: String) {

    if(1/*object is a transaction*/){

        this.knownObjects.set(objectid, object); 
        this.store() 

        this.gossipObject(object, objectid); 
    }

    }

  gossipObject(object: Object, objectid: String ){ 
    for (const peerAddr of peerManager.knownPeers) {
        logger.info(`Attempting to gossip to peer: ${peerAddr} with objectid: ${objectid}`)
        try {
          const peer = new Peer(MessageSocket.createClient(peerAddr)) //TODO: do we have to create a whole new peer/attempt a connection
          peer.sendIHaveObject(objectid); 
        }
        catch (e: any) {
          logger.warn(`Failed to gossip to peer ${peerAddr}: ${e.message}`)
        }
    }
}
}
export const objectManager = new ObjectManager()
