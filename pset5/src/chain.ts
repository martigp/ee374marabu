import { Block } from "./block";
import { logger } from "./logger";
import { mempool } from "./mempool";
import { Transaction } from "./transaction";
import {db} from "./object"
import { AnnotatedError } from "./message";

export class Chain {
  chain : Block[]
  constructor(chain : Block[]) {
    this.chain = chain
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
      this.longestChainHeight = height
      this.longestChainTip = block
      await this.store()
    }
  }
  async findUncommonSuffix(shorterChainTip: Block, longerChainTip: Block): Promise<[Chain, Chain]> {
    /* Base case */
    if (shorterChainTip.blockid == longerChainTip.blockid) {
      return [new Chain([shorterChainTip]), new Chain([shorterChainTip])]
    } else {
      if (shorterChainTip.height === undefined || longerChainTip.height === undefined)
          throw new AnnotatedError('INTERNAL_ERROR', "Blocks don't have heights")
      if (shorterChainTip.height < longerChainTip.height){
        /* Get prev of longerChainTip,
          validate prev
          return findUncommonSuffix(shorterChainTip, parentLongerChainTip)
          new_ret[1].push(longerChainTip)

         */
      } else {
        /*Get prev of both
          validate both prev
           new ret = findUncommonSuffix(parentShorterChainTip, parentLongerChainTip)
           new_ret[0].push(shorterChainTip)
           new_ret[1].push(longerChainTip)
          */
      }
    }
  }
}

export const chainManager = new ChainManager()