// Start chain initially as just the genesis block
import { GENESIS } from './block'
import { canonicalize } from 'json-canonicalize'
import { hash } from './crypto/hash'
import { ObjectId, objectManager } from './object'
import { Peer } from './peer'
import { BlockObject, AnnotatedError } from './message'
import { Block } from './block'
import { logger } from './logger'

export class ChainManager {
    height: number
    blockid: ObjectId
    constructor() {
        this.height = 0
        this.blockid = hash(canonicalize(GENESIS))
    }
    /* Check if height is large enough, if so update */
    update(height: number, blockid: ObjectId) {
        if (height > this.height) {
            logger.debug(`Updating chain tip to block ${blockid} with height ${height}`)
            this.height = height
            this.blockid = blockid
        }
    }
}

export const chainManager = new ChainManager()