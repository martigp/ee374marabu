import { ObjectId, ObjectStorage, UTXOStorage } from './store'
import {
    AnnotatedError,
    BlockObjectType,
    CoinbaseTransactionObject,
    ObjectType,
    OutpointObjectType,
    SpendingTransactionObject,
    TransactionOutputObjectType,
} from './message'
import { PublicKey, Signature, ver } from './crypto/signature'
import { canonicalize } from 'json-canonicalize'
import { hash } from './crypto/hash'
import { network, TIMEOUT_DELAY } from './network'
import { Output, Transaction } from './transaction'
import { logger } from './logger'
import { Union } from 'runtypes'

const T : string = "00000000abc00000000000000000000000000000000000000000000000000000"
const BLOCK_REWARD : number = 50 * (10 ** 12)

export class Block {
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
                reject(new AnnotatedError("UNFINDABLE_OBJECT", `Couldn't find ${txid} on network`))
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
        let seenCoinbase = false
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

        // Do we need to do more checking with previd
        let utxoSet = new Array<OutpointObjectType>()
        if (this.previd) {
            if(!await UTXOStorage.exists(this.previd)) {
                throw new AnnotatedError("INTERNAL_ERROR", `Can't find previd ${this.previd} in UTXO set`)
            }
            utxoSet = await UTXOStorage.get(this.previd) as Array<OutpointObjectType>
        }


        // All Txs are valid / satisfy weak conservation
        // Now just need to sum the transaction fees for each tx
        for (let i = 0; i < this.txids.length; i++) {
            let txid: ObjectId = this.txids[i];
            console.log(`Gordon with TXID ${txid}`)
            if (!(await ObjectStorage.exists(txid))) {
                throw new AnnotatedError('UNFINDABLE_OBJECT', `${i}th Tx not found`)
            }

            let obj = await ObjectStorage.get(txid);
            if(!Union(SpendingTransactionObject, CoinbaseTransactionObject).guard(obj)) {
                throw new AnnotatedError("UNFINDABLE_OBJECT", `Object ${txid} is not a transaction`)
            }
            let tx : Transaction = await Transaction.fromNetworkObject(obj);

            // CoinbaseTx, only need to check output lenght is 1
            if (tx.inputs.length === 0) {
                if(tx.outputs.length !== 1){
                    throw new AnnotatedError('INVALID_FORMAT', 'Outputs length != 0, invalid coinbase')
                }
                // More than one coinbase
                if (seenCoinbase) {
                    throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'There can only be one coinbase transaction per block. There is more')
                }
                //Not the first in the index
                if (i !== 0) { 
                    throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'Coinbase transaction is not at index 0')
                }
                // Valid coinbase
                seenCoinbase = true
                coinbaseId = ObjectStorage.id(tx)
                coinbaseValue = tx.outputs[0].value;
                // Add to UTXO set
                let newUTXO : OutpointObjectType = {
                    txid: txid,
                    index: 0
                }
                console.log(`Gordon COINBASE output from ${canonicalize(newUTXO)}`)
                try {
                    utxoSet.push(newUTXO)
                } catch(e) {
                    console.log(e)
                    throw new AnnotatedError("INTERNAL_ERROR", "Issue adding utxo to set");
                }
            }
            // Spending Tx - get sum inputs and outputs
            else {
                const inputValues = await Promise.all(
                    tx.inputs.map(async (input, j) => {
                        if (input.outpoint.txid === coinbaseId) {
                            throw new AnnotatedError('INVALID_TX_OUTPOINT', `Input ${j} spends coinbaseTx in same block`)
                        }
                        // Double check this is the correct ordering
                        const prevOutput = await input.outpoint.resolve()
                        // Check if present for deletion
                        
                        // Checks if in array
                        console.log(utxoSet)
                        let utxoSetIdx = utxoSet.findIndex(utxo => utxo.txid == input.outpoint.txid && utxo.index == input.outpoint.index);
                        if (utxoSetIdx === -1) {
                            throw new AnnotatedError('INVALID_TX_OUTPOINT', `Input ${j} spends Outpoint not in UTXO set`)
                        }
                        utxoSet.splice(utxoSetIdx, 1)
                        return prevOutput.value
                    })
                )
                
                for (const inputValue of inputValues) {
                    sumInputs += inputValue
                }
                for (let output_idx = 0; output_idx < tx.outputs.length; output_idx++) {
                    sumOutputs += tx.outputs[output_idx].value
                    // Adding to UTXO set
                    let newUTXO : OutpointObjectType = {
                        txid: txid,
                        index: output_idx
                    }
                    console.log(`Gordon REGULAR output from ${canonicalize(newUTXO)}`)
                    try {
                        utxoSet.push(newUTXO)
                    } catch(e) {
                        throw new AnnotatedError("INTERNAL_ERROR", "Issue adding utxo to set");
                    }
                }
            }
        }

        //Satisfy weak conservation 
        if(((sumInputs - sumOutputs) + BLOCK_REWARD) < coinbaseValue){ 
            logger.info(`Sum Inputs:${sumInputs}, Sum outputs:${sumOutputs},
            ${BLOCK_REWARD}, and coinbase value ${coinbaseValue}`)
            throw new AnnotatedError('INVALID_BLOCK_COINBASE', 'Coinbase breaks the weak law of conservation')
        }

        // All satisfied -> commit to storage
        await UTXOStorage.put(this.blockid, utxoSet)
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
