import { Block } from "./block";
import { logger } from "./logger";
import { mempool } from "./mempool";
import { Transaction } from "./transaction"
import {db, objectManager} from "./object"
import { AnnotatedError } from "./message"

export class Forks {
  shorterChain : Block[]
  longerChain : Block[]
  constructor(shorterChain : Block[], longerChain: Block []) {
    this.shorterChain = shorterChain
    this.longerChain = longerChain
  }
}

class ChainManager {
  longestChainHeight: number = 0
  longestChainTip: Block | null = null

  async init() {
    try {
      await this.load()
    }
    catch {
      logger.debug("Failed to load initializing new chain.")
      this.longestChainHeight = 0
      this.longestChainTip = await Block.makeGenesis()
      await this.store()
    }
    logger.debug("Chain Manager Initialized.")
  }

  async load(){
    this.longestChainHeight = await db.get('longestchain:height') //TODO: Initialize the mempool state by applying the transactions in your longest chain
    this.longestChainTip = await Block.fromNetworkObject (await db.get('longestchain:tip'))
  }

  async store() {
    try {
      await db.put('longestchain:height', this.longestChainHeight)
      await db.put('longestchain:tip', this.longestChainTip?.toNetworkObject())
    }
    catch{
      logger.debug ("Failed to store longestchain info.")
    }
  }
  async onValidBlockArrival(arrivedBlock: Block) {
    if (!arrivedBlock.valid) {
      throw new Error(`Received onValidBlockArrival() call for invalid block ${arrivedBlock.blockid}`)
    }
    const height = arrivedBlock.height

    if (this.longestChainTip === null) {
      throw new Error('We do not have a local chain to compare against')
    }
    if (height === undefined) {
      throw new Error(`We received a block ${arrivedBlock.blockid} we thought was valid, but had no calculated height.`)
    }
    if (arrivedBlock.stateAfter === undefined)
      throw new AnnotatedError('INTERNAL_ERROR', `New tip ${arrivedBlock.blockid} did not have associated state.`)
    if (height > this.longestChainHeight) {
      /* Now need to do the mempool update based on common ancestor
         this will involve a procedure that finds the two forks starting
         at the common ancestor. */
      logger.debug(`New longest chain has height ${height} and tip ${arrivedBlock.blockid}`)
      if (arrivedBlock.previd == this.longestChainTip.blockid) {
        await mempool.update(arrivedBlock.stateAfter, false)
      } else {
        const forks : Forks = await this.findUncommonSuffix(this.longestChainTip, arrivedBlock)
        await mempool.update(arrivedBlock.stateAfter, true, forks.shorterChain)
      }
      const forks : Forks = await this.findUncommonSuffix(this.longestChainTip, arrivedBlock)
      this.longestChainHeight = height
      this.longestChainTip = arrivedBlock
      await this.store()
    }
    logger.debug(`New block ${arrivedBlock.blockid} height ${arrivedBlock.height} less than current longests 
                  ${this.longestChainTip.blockid} height ${this.longestChainHeight}`)
  }
  async findUncommonSuffix(shorterChainTip: Block, longerChainTip: Block): Promise<Forks> {
    /* All should technically be valid since it has gotten to this point. */
    if (shorterChainTip.blockid == longerChainTip.blockid) {
      return new Forks([], [])
    } else {
      if (shorterChainTip.height === undefined || longerChainTip.height === undefined)
          throw new AnnotatedError('INTERNAL_ERROR', `Blocks ${shorterChainTip.blockid} height ${shorterChainTip.height}
                                                      Blocks ${longerChainTip.blockid} height ${longerChainTip.height}`)
      const longerParent = await longerChainTip.loadParent()
      if (longerParent === undefined)
        throw new AnnotatedError('INTERNAL_ERROR', `Longer chain block ${longerChainTip.blockid} had unfindable parent.`)
      
      let forks = null
      if (shorterChainTip.height < longerChainTip.height){
          forks = await this.findUncommonSuffix(shorterChainTip, longerParent)
      } else {
        const shorterParent = await shorterChainTip.loadParent()
        if (shorterParent === undefined)
          throw new AnnotatedError('INTERNAL_ERROR', `Shorter chain block ${shorterChainTip.blockid} had unfindable parent.`)
        forks = await this.findUncommonSuffix(shorterParent, longerParent)
        forks.shorterChain.push(shorterChainTip)
      }
      forks.longerChain.push(longerChainTip)
      return forks
    }
  }
}

export const chainManager = new ChainManager()