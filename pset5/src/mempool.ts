import { Block } from './block'
import { logger } from './logger'
import { AnnotatedError } from './message'
import { Outpoint, Transaction } from './transaction'
import { ObjectId, objectManager } from './object'

export class Mempool {
  transactions: Set<ObjectId> = new Set<ObjectId>()

  constructor(transactions: Set<ObjectId>) {
    this.transactions = transactions
  }
  copy() {
    return new Mempool(new Set<ObjectId>(Array.from(this.transactions)))
  }

  async apply(tx: Transaction) {
    logger.debug(`Applying transaction ${tx.txid} to mempool`)
    //TODO: Implement this! 
    this.transactions.add(tx.txid)
  }
  async delete(tx: Transaction) {
    logger.debug(`Deleting transaction ${tx.txid} from mempool`)
    //TODO: Implement this! 
    this.transactions.add(tx.txid)
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
