import { ObjectId, ObjectStorage } from './store'
import {
    AnnotatedError,
    BlockObjectType,
    ObjectType,
} from './message'
import { PublicKey, Signature, ver } from './crypto/signature'
import { canonicalize } from 'json-canonicalize'
import { hash } from './crypto/hash'
import { network } from './network'
import { Transaction } from './transaction'

export class Block { //TODO: typing for this? 
    blockid: ObjectId
    T: string
    created: number
    miner: string | null = null
    nonce: string
    note: string | null = null
    previd: string | null = null
    txids: ObjectId[] = []
    studentids: string[] | null = null

    static fromNetworkObject(blockObj: BlockObjectType): Block {
        let T: string = blockObj.T
        let created: number = blockObj.created
        let miner: string | null = null
        let nonce: string = blockObj.nonce
        let note: string | null = null
        let previd: string | null = blockObj.previd
        let txids: ObjectId[] = blockObj.txids
        let studentids: string[] | null = null

        miner = (blockObj.miner != null) ? blockObj.miner : null
        note = (blockObj.note != null) ? blockObj.note : null
        studentids = (blockObj.studentids != null) ? blockObj.studentids : null

        return new Block(ObjectStorage.id(blockObj), T, created, miner, nonce, note, previd, txids, studentids)
    }
    static async byId(blockid: ObjectId): Promise<Block> {
        return this.fromNetworkObject(await ObjectStorage.get(blockid))
    }
    constructor(blockid: ObjectId, T: string, created: number, miner: string | null = null, nonce: string, note: string | null = null, previd: string | null, txids: ObjectId[], studentids: string[] | null = null) {
        this.T = T
        this.created = created
        this.miner = miner
        this.nonce = nonce
        this.note = note
        this.previd = previd
        this.txids = txids
        this.studentids = studentids
    }
    async validate() {
        let genesis_count: number = 0
        let genesis_id = ''
        const unsignedBlockStr = canonicalize(this.toNetworkObject())

        if (this.T !== '00000000abc00000000000000000000000000000000000000000000000000000') {
            throw new AnnotatedError('INVALID_FORMAT', 'Failed to parse block object')
        }

        if (this.blockid > this.T) {
            throw new AnnotatedError('INVALID_BLOCK_POW', 'Failed to validate the proof of work')
        }

        for (let i = 0; i < this.txids.length; i++) {
            let txid: ObjectId = this.txids[i];
            if (!(await ObjectStorage.exists(txid))) {
                network.broadcast({
                    type: 'getobject',
                    objectid: txid
                })
                //TODO: how to wait for broadcast to be over? some sort of async await stuff 
            }
            if (!(await ObjectStorage.exists(txid))) {
                throw new AnnotatedError('UNFINDABLE_OBJECT', 'Failed to validate the proof of work')
            }
            let obj = await Transaction.byId(txid);
            if (obj.inputs.length == 0) { //TODO: if this is how a coinbase transaction is identified 
                if (genesis_count == 1) {
                    throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'There can only be one genesis transaction per block. There is more')
                }
                else {
                    if (i != 0) { //if it is no the first in the index 
                        throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'Genesis transaction is not at index 0')
                    }
                    else {
                        genesis_count += 1
                        genesis_id = ObjectStorage.id(obj) //TODO: is this the right object ID 
                    }
                }
            }
            else {
                const inputValues = ( //this feels like the wrong way to do this 
                    obj.inputs.map(async (input, j) => {
                        const prevtxid = input.outpoint.txid
                        if(prevtxid === genesis_id){ //am i comparing the right two things 
                            throw new AnnotatedError('INVALID_TX_OUTPOINT', 'You cannot spend genesis in the same block it exists in')
                        }
                        return prevtxid
                    })
                )
               
            }
        }
    }

    toNetworkObject(): BlockObjectType {
        if (this.note != null && this.miner != null && this.studentids != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                miner: this.miner,
                nonce: this.nonce,
                note: this.note,
                previd: this.previd,
                txids: this.txids,
                studentids: this.studentids
            }
        }
        if (this.note != null && this.miner != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                miner: this.miner,
                nonce: this.nonce,
                note: this.note,
                previd: this.previd,
                txids: this.txids,
            }
        }
        if (this.note != null && this.studentids != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                nonce: this.nonce,
                note: this.note,
                previd: this.previd,
                txids: this.txids,
                studentids: this.studentids

            }
        }
        if (this.miner != null && this.studentids != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                nonce: this.nonce,
                miner: this.miner,
                previd: this.previd,
                txids: this.txids,
                studentids: this.studentids

            }
        }
        if (this.miner != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                nonce: this.nonce,
                miner: this.miner,
                previd: this.previd,
                txids: this.txids,

            }
        }
        if (this.note != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                nonce: this.nonce,
                previd: this.previd,
                txids: this.txids,
                note: this.note

            }
        }
        if (this.studentids != null) {
            return {
                type: 'block',
                T: this.T,
                created: this.created,
                nonce: this.nonce,
                previd: this.previd,
                txids: this.txids,
                studentids: this.studentids

            }
        }
        return {
            type: 'block',
            T: this.T,
            created: this.created,
            nonce: this.nonce,
            previd: this.previd,
            txids: this.txids,
        }

    }
}
