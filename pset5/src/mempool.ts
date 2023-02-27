import { Block } from './block'
import { logger } from './logger'
import { AnnotatedError } from './message'
import { Outpoint, Transaction } from './transaction'
import { ObjectId, objectManager } from './object'
import { db } from './object'

class Mempool {
  transactions: Set<ObjectId> = new Set<ObjectId>()

  async load() {
    try {
      this.transactions = new Set(await db.get('mempool')) //TODO: Initialize the mempool state by applying the transactions in your longest chain
      logger.debug(`Loaded saved mempool: ${[...this.transactions]}`)
    }
    catch {
      logger.info(`Initializing mempool database`)
      this.transactions = new Set() //TODO: add transactions from longest chain in response to getChaintip events 
      await this.store()
    }
  }
  async store() {
    await db.put('mempool', [...this.transactions])
  }

  async apply(tx: Transaction) {
    logger.debug(`Applying transaction ${tx.txid} to mempool`)
    //TODO: validate this! 
    this.transactions.add(tx.txid)
    this.store() // intentionally delayed await
    logger.info(`Mempool size: ${this.transactions.size}`)
  }
  async delete(tx: Transaction) {
    logger.debug(`Deleting transaction ${tx.txid} from mempool`)
    this.transactions.delete(tx.txid)
    this.store() // intentionally delayed await
    logger.info(`Mempool size: ${this.transactions.size}`)
  }
  async applyMultiple(txs: Transaction[], block?: Block) {
    for (const tx of txs) {
      logger.debug(`Applying transaction ${tx.txid} to state`)
      await this.apply(tx)
      logger.debug(`State after transaction application is: ${this}`)
    }
  }
  toString() {
    return `mempool : ${JSON.stringify(Array.from(this.transactions))}`
  }
}

export const mempool = new Mempool()
