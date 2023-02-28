import { Block } from './block'
import { logger } from './logger'
import { AnnotatedError } from './message'
import { Outpoint, Transaction } from './transaction'
import { ObjectId, objectManager } from './object'
import { db } from './object'
import { UTXOSet } from './utxo'
import { Forks } from './chain'

class Mempool {
  transactions: string[] = []
  state: UTXOSet | undefined

  async load() {
    try {
      this.transactions = new Array(await db.get('mempool:txs')) //TODO: Initialize the mempool state by applying the transactions in your longest chain
      logger.debug(`Loaded saved mempool: ${[...this.transactions]}`)
    }
    catch {
      logger.info(`Initializing mempool database`)
      this.transactions = []
    }
    try {
      const stateArray = await db.get('mempool:state')
      logger.debug(`Loaded saved state: ${stateArray}`)
      this.state = new UTXOSet(new Set<string>(stateArray))
    }
    catch {
      this.state = new UTXOSet(new Set())
    }
  }
  async store() {
    if (this.state == undefined){
      throw new AnnotatedError('INTERNAL_ERROR', "Cannot add undefined state to db.")
    }
    await db.put('mempool:txs', [...this.transactions])
    await db.put('mempool:state', Array.from(this.state.outpoints))
  }

  async apply(tx: Transaction) {
    logger.debug(`Applying transaction ${tx.txid} to mempool`)
    /* Will throw an error if we cannot apply. */
    await this.state?.apply(tx);
    this.transactions.push(tx.txid)
    await this.store()
    logger.info(`Mempool size: ${this.transactions.length}`)
  }
  /* If a simple new block on top of existing. Blocks*/
  async update(newState: UTXOSet, reorg : boolean, shortFork?: Block[] ){
    logger.debug("Beginning mempool update")
    let maybeTxs : string[] = []
    if (reorg && shortFork !== undefined) {
      for(const block of shortFork){
        for(const txid of block.txids){
          maybeTxs.push(txid)
        }
      }
    }
    maybeTxs.concat(this.transactions)                 
    this.transactions = []
    this.state = newState
    for (const txid of maybeTxs) {
      try {
        let tx = await Transaction.byId(txid)
        await this.state?.apply(tx)
        this.transactions.push(txid)
        logger.debug(`Applied tx ${txid} to the mempool`)
      }
      catch {
        logger.debug(`Failed to apply or find ${txid}`)
      }
    }
    await this.store()
  }
}

export const mempool = new Mempool()
