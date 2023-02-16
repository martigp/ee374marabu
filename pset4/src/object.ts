export type ObjectId = string

import level from 'level-ts'
import { canonicalize } from 'json-canonicalize'
import { ObjectTxOrBlock, ObjectType,
         TransactionObjectType, BlockObjectType, AnnotatedError } from './message'
import { Transaction } from './transaction'
import { Block } from './block'
import { logger } from './logger'
import { hash } from './crypto/hash'
import { Peer } from './peer'
import { Deferred, delay, resolveToReject } from './promise'

export const db = new level('./db')
const OBJECT_AVAILABILITY_TIMEOUT = 5000 // ms

class ObjectManager {
  /* An array of deferred objects means we don't do extra work if
     several threads/sockets want an object we dont' possess */
  deferredObjects: { [key: string]: Deferred<ObjectType>[] } = {}

  id(obj: any) {
    return hash(canonicalize(obj))
  }
  async exists(objectid: ObjectId) {
    return await db.exists(`object:${objectid}`)
  }
  async get(objectid: ObjectId) {
    try {
      return await db.get(`object:${objectid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Object ${objectid} not known locally`)
    }
  }
  async del(objectid: ObjectId) {
    try {
      return await db.del(`object:${objectid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Object ${objectid} not known locally`)
    }
  }
  async put(object: any) {
    const objectid = this.id(object)
    /* We put an object in our DB the second we receive it, this is
       to ensure that when we have attempted to retrieve and object from
       network. This means we can resolve the promise without having to
       do the expensive validation */
    logger.debug(`Storing object with id ${objectid}: %o`, object)
    if (objectid in this.deferredObjects) {
      for (const deferred of this.deferredObjects[objectid]) {
        deferred.resolve(object)
      }
      delete this.deferredObjects[objectid]
    }
    return await db.put(`object:${this.id(object)}`, object)
  }
  async validate(object: ObjectType, peer: Peer) {
    return await ObjectTxOrBlock.match<Promise<Block | Transaction>>(
      async (obj: TransactionObjectType) => {
        const tx: Transaction = Transaction.fromNetworkObject(obj)
        logger.debug(`Validating transaction: ${tx.txid}`)
        await tx.validate()
        return tx
      },
      async (obj: BlockObjectType) => {
        const block = await Block.fromNetworkObject(obj)
        logger.debug(`Validating block: ${block.blockid}`)
        await block.validate(peer)
        return block
      }
    )(object)
  }
  async retrieve(objectid: ObjectId, peer: Peer): Promise<ObjectType> {
    logger.debug(`Retrieving object ${objectid}`)
    let object: ObjectType
    const deferred = new Deferred<ObjectType>()

    if (!(objectid in this.deferredObjects)) {
      this.deferredObjects[objectid] = []
    }
    this.deferredObjects[objectid].push(deferred)

    /* Unclear why add to deferred objects before checking if present
       in our db */
    try {
      object = await this.get(objectid)
      logger.debug(`Object ${objectid} was already in database`)
      return object
    }
    catch (e) {}

    logger.debug(`Object ${objectid} not in database. Requesting it from peer ${peer.peerAddr}.`)
    await peer.sendGetObject(objectid)

    /* Provides race between object retrieval and timeout provided by delays */
    object = await Promise.race([
      resolveToReject(
        delay(OBJECT_AVAILABILITY_TIMEOUT),
        `Timeout of ${OBJECT_AVAILABILITY_TIMEOUT}ms in retrieving object ${objectid} exceeded`
      ),
      deferred.promise
    ])

    logger.debug(`Object ${objectid} was retrieved from peer ${peer.peerAddr}.`)

    return object
  }
}

export const objectManager = new ObjectManager()
