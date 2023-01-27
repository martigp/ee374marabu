import { db } from './store'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'
import { transactionManager } from './transactionmanager'
import * as mess from './message'
import * as obj from './application_objects/object'
import * as ed from '@noble/ed25519'


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

  getObject(objectid: String) {
      return {
        "success" : this.knownObjects.has(objectid),
        "object" : this.knownObjects.get(objectid)
      }
  }

  objectDiscovered(object: obj.ApplicationObjectType, objectid: String) {
    this.knownObjects.set(objectid, object); 
    this.store();
  }

}
export const objectManager = new ApplicationObjectManager()
