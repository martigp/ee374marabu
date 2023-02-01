export type ObjectId = string

import level from 'level-ts'
import { canonicalize } from 'json-canonicalize'
import { AnnotatedError, TransactionObject, ObjectType, BlockObject, OutpointObjectType, BlockObjectType } from './message'
import { Transaction } from './transaction'
import { Block } from './block'
import { logger } from './logger'
import { hash } from './crypto/hash'
import { EventEmitter } from 'events'

const GENESIS : ObjectType =  {
  T: "00000000abc00000000000000000000000000000000000000000000000000000",
  created: 1671062400,
  miner: "Marabu",
  nonce: "000000000000000000000000000000000000000000000000000000021bea03ed",
  note: "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
  previd: null,
  txids: [],
  type: "block"
}

export const db = new level('./db')

export class ObjectStorage {
  static async addGenesis() {
    if(! await this.exists(this.id(GENESIS))) {
      await this.put(GENESIS)
    }
  }
  static id(obj: any) {
    const objStr = canonicalize(obj)
    const objId = hash(objStr)
    return objId
  }
  static async exists(objectid: ObjectId) {
    return await db.exists(`object:${objectid}`)
  }
  static async get(objectid: ObjectId) {
    try {
      return await db.get(`object:${objectid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Object ${objectid} not known locally`)
    }
  }
  static async del(objectid: ObjectId) {
    try {
      return await db.del(`object:${objectid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Object ${objectid} not known locally`)
    }
  }
  static async put(object: any) {
    logger.debug(`Storing object with id ${this.id(object)}: %o`, object)
    return await db.put(`object:${this.id(object)}`, object)
  }
  static async validate(object: ObjectType) {
    if(object.type == 'transaction'){
      if (!TransactionObject.guard(object)) {
        throw new AnnotatedError('INVALID_FORMAT', 'Failed to parse transaction object')
      }
      const tx = Transaction.fromNetworkObject(object)
      await tx.validate()
    }
    else if(object.type == 'block'){
      if (!BlockObject.guard(object)) {
        throw new AnnotatedError('INVALID_FORMAT', 'Failed to parse block object')
      }
      const block = Block.fromNetworkObject(object)
      await block.validate()
    }
  }

}

export class UTXOStorage {
  static async addGenesis() {
    let genesisId = ObjectStorage.id(GENESIS)
    if(! await this.exists(genesisId)) {
      await this.put(genesisId, new Array<OutpointObjectType>())
    }
  }
  static async exists(blockid: ObjectId) {
    return await db.exists(`utxoset:${blockid}`)
  }
  static async get(blockid: ObjectId) {
    try {
      return await db.get(`utxoset:${blockid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Block ${blockid} UTXO set not known locally`)
    }
  }
  static async del(blockid: ObjectId) {
    try {
      return await db.del(`utxos:${blockid}`)
    } catch {
      throw new AnnotatedError('UNKNOWN_OBJECT', `Block ${blockid} UTXO set not known locally`)
    }
  }
  static async put(blockid: ObjectId, utxoSet: Array<OutpointObjectType>) {
    logger.debug(`Storing block UTXO set with id ${blockid}: %o`, utxoSet)
    return await db.put(`utxoset:${blockid}`, utxoSet)
  }
}
