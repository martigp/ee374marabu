import { ObjectId, ObjectStorage } from './store'
import {
    AnnotatedError,
    BlockObjectType,
    ObjectType,
} from './message'
import { PublicKey, Signature, ver } from './crypto/signature'
import { canonicalize } from 'json-canonicalize'
import { hash } from './crypto/hash'
import { network, TIMEOUT_DELAY } from './network'
import { Transaction } from './transaction'
import { logger } from './logger'

const T : string = "00000000abc00000000000000000000000000000000000000000000000000000"
const BLOCK_REWARD : number = 50 * (10 ** 12)

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
        this.blockid = blockid
        this.T = T
        this.created = created
        this.miner = miner
        this.nonce = nonce
        this.note = note
        this.previd = previd
        this.txids = txids
        this.studentids = studentids
    }

    private async findTransaction(txid: ObjectId) {
        return new Promise<void>((resolve, reject) => {
            // Kinda slow is there a quicker way?
            const timeout = setTimeout(()=> {
                reject(new AnnotatedError("UNFINDABLE_OBJECT", `Valid tx with txid ${txid} unfindable)`))
            }, TIMEOUT_DELAY)


            network.once(txid, () => {
                clearTimeout(timeout)
                resolve()
            })

            network.broadcast({
                type: 'getobject',
                objectid: txid
            });
        })
    }

    async validate() {
        let coinbaseId = ''
        let coinbaseValue = 0
        let sumInputs = 0 
        let sumOutputs = 0 

        if (this.T !== T) {
            throw new AnnotatedError('INVALID_FORMAT', `Invalid target ${this.T}`)
        }

        if (this.blockid > this.T) {
            throw new AnnotatedError('INVALID_BLOCK_POW', 'Failed to validate the proof of work')
        }

        // Make sure we have all transactions
        try {
            let pendingTxs : Promise<void>[] = []
            for (let i = 0; i < this.txids.length; i++) {
                let txid: ObjectId = this.txids[i];
                if (!(await ObjectStorage.exists(txid))) {
                    pendingTxs.push(this.findTransaction(txid))
                }
            }
            for(const pendingTx of pendingTxs) {
                await pendingTx;
            }

        } catch(e) {
            throw e
        }
        logger.debug("All Txes received")
        // All Txs are valid / satisfy weak conservation
        // Now just need to sum the transaction fees for each tx
        for (let i = 0; i < this.txids.length; i++) {
            let txid: ObjectId = this.txids[i];
            if (!(await ObjectStorage.exists(txid))) {
                throw new AnnotatedError('UNFINDABLE_OBJECT', 'One tx not stored in ')
            }
            let tx : Transaction = await Transaction.byId(txid);

            // CoinbaseTx, only need to check output lenght is 1
            if (tx.inputs.length === 0) { //TODO: if this is how a coinbase transaction is identified 
                if(tx.outputs.length !== 1){
                    throw new AnnotatedError('INVALID_FORMAT', 'Outputs length != 0 or there is a no height')
                }
                // More than one coinbase
                if (coinbaseId) {
                    throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'There can only be one coinbase transaction per block. There is more')
                }
                //Not the first in the index
                if (i !== 0) { 
                    throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'Coinbase transaction is not at index 0')
                }
                // Valid coinbase
                else {
                    coinbaseId = ObjectStorage.id(tx) //TODO: is this the right object ID 
                    coinbaseValue = tx.outputs[0].value; //
                }
            }
            // Spending Tx - get sum inputs and outputs
            else {
                const inputValues = await Promise.all(
                    tx.inputs.map(async (input, i) => {
                        if (input.outpoint.txid === coinbaseId) {
                            throw new AnnotatedError('INVALID_TX_OUTPOINT', `Transaction ${i} spends coinbaseTx in same block`)
                        }
                        const prevOutput = await input.outpoint.resolve()
                        return prevOutput.value
                    })
                )
                
                for (const inputValue of inputValues) {
                    sumInputs += inputValue
                }
                for (const output of tx.outputs) {
                    sumOutputs += output.value
                }
            }
        }
        //Satisfy weak conservation 
        if(((sumInputs - sumOutputs) + BLOCK_REWARD) < coinbaseValue){ 
            logger.info(`Sum Inputs:${sumInputs}, Sum outputs:${sumOutputs},
            ${BLOCK_REWARD}, and coinbase value ${coinbaseValue}`)
            throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'Coinbase breaks the weak law of conservation')
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
