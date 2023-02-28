import { Block } from "./block";
import { logger } from "./logger";
import { mempool } from "./mempool";
import { Transaction } from "./transaction";
import {db, objectManager} from "./object"
import { AnnotatedError } from "./message";

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
  async onValidBlockArrival(block: Block) {
    if (!block.valid) {
      throw new Error(`Received onValidBlockArrival() call for invalid block ${block.blockid}`)
    }
    const height = block.height

    if (this.longestChainTip === null) {
      throw new Error('We do not have a local chain to compare against')
    }
    if (height === undefined) {
      throw new Error(`We received a block ${block.blockid} we thought was valid, but had no calculated height.`)
    }
    if (height > this.longestChainHeight) {
      /* Now need to do the mempool update based on common ancestor
         this will involve a procedure that finds the two forks starting
         at the common ancestor. */
      logger.debug(`New longest chain has height ${height} and tip ${block.blockid}`)
      if (block.previd == this.longestChainTip.previd) {
        await mempool.update(block)
      } else {
        const forks : Forks = await this.findUncommonSuffix(this.longestChainTip, block)
        await mempool.reorg(forks)
      }
      const forks : Forks = await this.findUncommonSuffix(this.longestChainTip, block)
      this.longestChainHeight = height
      this.longestChainTip = block
      await this.store()
    }
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
          forks = await this.findUncommonSuffix(shorterChainTip, longerParent)
          forks.shorterChain.push(shorterChainTip)
      }
      return forks
    }
  }
}

export const chainManager = new ChainManager()