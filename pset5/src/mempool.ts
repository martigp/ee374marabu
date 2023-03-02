import { Block } from './block'
import { logger } from './logger'
import { AnnotatedError } from './message'
import { Outpoint, Transaction } from './transaction'
import { ObjectId, objectManager } from './object'
import { db } from './object'
import { UTXOSet } from './utxo'
import { Forks } from './chain'

class Mempool {
  transactions: Transaction[] = []
  state: UTXOSet | undefined

  async load() {
    try {
      const txids : ObjectId[] = new Array(await db.get('mempool:txs'))
      this.transactions = []
      for (const txid of txids){
        this.transactions.push(Transaction.fromNetworkObject(await objectManager.get(txid)))
      }
      logger.debug(`Loaded saved mempool: ${[...this.transactions]}`)
    }
    catch {
      logger.info(`Initializing mempool database to empty`)
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
    let txids :string[] = []
    for (const tx of this.transactions) {
      txids.push (tx.txid)
    }
    await db.put('mempool:txs', [...txids])
    await db.put('mempool:state', Array.from(this.state.outpoints))
  }

  async apply(tx: Transaction) {
    logger.debug(`Applying transaction ${tx.txid} to mempool`)
    /* Will throw an error if we cannot apply. */
    await this.state?.apply(tx);
    this.transactions.push(tx)
    logger.debug(`Transaction ${tx.txid} added to mempool.`)
    await this.store()
    logger.info(`Mempool size: ${this.transactions.length}`)
  }
  /* If a simple new block on top of existing. Blocks*/
  async update(newState: UTXOSet, reorg : boolean, shortFork?: Block[] ){
    logger.debug("Beginning mempool update")
    let maybeTxs : Transaction[] = []
    if (reorg && shortFork !== undefined) {
      for(const block of shortFork){
        maybeTxs.concat(await block.getTxs())
      }
    }
    maybeTxs.concat(this.transactions)                 
    this.transactions = []
    this.state = newState
    for (const tx of maybeTxs) {
      try {
        await this.apply(tx)
        logger.debug("Upon arrival of new block mempool was updated"
                     +`with tx ${tx.txid}`)
      }
      catch {
        logger.debug(`Failed to apply or find ${tx.txid}`)
      }
    }
    await this.store()
  }
}

export const mempool = new Mempool()
