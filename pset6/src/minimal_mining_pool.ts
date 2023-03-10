import {db, objectManager} from './object'
import * as ed from '@noble/ed25519'
import {logger} from './logger'
import { hash } from './crypto/hash'
import { hex2uint8, uint82hex, ver } from './crypto/signature'
import { canonicalize } from 'json-canonicalize'
import { BlockObject, BlockObjectType, TransactionObject, TransactionObjectType } from './message'
import { ObjectId } from './object'
import { Transaction } from './transaction'
import  { Block } from './block'
import { network } from './network'
import { ChildProcess, spawn } from 'child_process'
import { delay } from './promise'
import * as fs from 'fs'
import { mempool } from './mempool'
import { chainManager } from './chain'

const coinbaseTemplate = {
    height:10,
    outputs:
        [{
            pubkey:"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f",
            value:50000000000000}],
    type:"transaction"
}

const spendingTemplate : TransactionObjectType = {
    inputs:[{
        outpoint:{
            index: 0,
            txid: "208aa95eaca2b3f862308ca8c85d7eac2efc974d8f05794c8381d2cc228c949e" 
        },
        sig: null
    }],
    outputs:[{
        pubkey:"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f",
        value:50000000000000
    }],
    type:"transaction"
}

const blockTemplate : BlockObjectType =  
{
    T: '00000000abc00000000000000000000000000000000000000000000000000000',
    created: 0,
    miner: 'Gordon & Mapau',
    nonce: hash("Gordon & Mapau starter nonce"),
    note: 'Gordon & mapau pset6 block',
    previd: '0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2',
    txids: [],
    type: 'block',
    studentids: ["martigp", "mapau"]
}

class MiningManager {
    pubkey : string
    privkey : string
    coinbase : any
    miningBlock : BlockObjectType
    miner : ChildProcess | null
    // worker : Worker | null

    constructor(){
        this.pubkey = "a"
        this.privkey = "b"
        this.coinbase = coinbaseTemplate
        this.miningBlock = blockTemplate
        // this.worker = null
        this.miner = null
    }
    async init () {
        if (! await db.exists('pubkey')) {
            /* Generating Keys if don't exist. */
            const privateKey = ed.utils.randomPrivateKey()
            const publicKey = await ed.getPublicKey(privateKey)
            this.pubkey = Buffer.from(publicKey).toString('hex')
            this.privkey = Buffer.from(privateKey).toString('hex')

            logger.debug (`Generated pubkey ${this.pubkey}`)
            await db.put('pubkey', this.pubkey)
            await db.put('privkey', this.privkey)
        } else {
            logger.debug("Reading in private and public keys.")
            this.pubkey = await db.get('pubkey')
            logger.debug (`Read in pubkey ${this.pubkey}`)
            this.privkey = await db.get('privkey')
        }
        fs.appendFile('./pubkey', `${this.pubkey}\n`, (err)=> {
            if (err)
                logger.debug(`Unable to append pubkey ${this.pubkey} to pubkey file`)
        })
        fs.appendFile('./privkey', `${this.privkey}\n`, (err)=> {
            if (err)
                logger.debug(`Unable to append pubkey ${this.privkey} to pubkey file`)
        })
        if (chainManager.longestChainTip !== null)
            this.newChainTip(chainManager.longestChainHeight, chainManager.longestChainTip.blockid, mempool.getTxIds())
    }

    async newChainTip(newHeight: number, newPrevid : ObjectId, txids: ObjectId[]){

        this.coinbase.height = newHeight + 1
        if (!TransactionObject.guard(this.coinbase)) {
            throw Error(`Created a structurally bad coinbase`)
        }
        let coinbaseTx = Transaction.fromNetworkObject(this.coinbase)
        try {
            await coinbaseTx.validate()
        }
        catch(e) {
            throw Error(`Created semantically incorrect coinbase for new mined block with error ${e}`)
        }
        await coinbaseTx.validate()

        let coinbaseId = hash(canonicalize(this.coinbase))

        logger.debug(`Generated new coinbase with with height ${newHeight + 1} and ID ${coinbaseId}`)
        try {
            await objectManager.put(this.coinbase)
        }
        catch(e){
            throw Error(`Failed to add new coinbase to store ${this.coinbase}`)
        }

        this.miningBlock.created = Math.floor(new Date().getTime() / 1000)
        this.miningBlock.nonce = hash(`Gordon & mapau ${newHeight}`)
        this.miningBlock.previd = newPrevid
        this.miningBlock.txids = [coinbaseId].concat(txids)

        logger.debug(`TXIDS being put int mining block ${txids}`)

        if(!BlockObject.guard(this.miningBlock))
            throw Error(`Incorrectly formatted template block ${this.miningBlock}`)

        if (this.miner !== null) {
            logger.debug("Killing existing miner")
            this.miner.kill('SIGKILL')
        }

        fs.writeFileSync('./block_to_mine', canonicalize(this.miningBlock), 'utf-8')

        let start_time = Math.floor(new Date().getTime() / 1000)
        logger.info(`Miner started at ${start_time}`)

        let wholeBlockArr = canonicalize(this.miningBlock).split(this.miningBlock.nonce)
        this.miner = spawn('pwd')
        //this.miner = spawn('./worker',[wholeBlockArr[0], blockTemplate.nonce, wholeBlockArr[1]])
        this.miner.on('error', (err)=>{
            logger.error("Failed to spawn child")
        })

        this.miner.stdio[1]?.on('data', async (data)=>{
            let buffer : string = "";
            buffer += data;
            let nonce = buffer.split('\n')[0]
            console.log(`Nonce received from miner` + nonce)
            let finish_time = Math.floor(new Date().getTime() / 1000)
            logger.info(`GORDON: miner finished at ${finish_time}`)
            logger.info(`GORDON miner time taken ${finish_time - start_time}`)
            this.miningBlock.nonce = nonce
            fs.appendFile('./mined_blocks', `${canonicalize(this.miningBlock)}\n`, (err)=>{
                if(err){
                    logger.debug(`Unsuccessful writing block ${this.miningBlock} to mined_blocks`)
                } else {
                    logger.debug(`Successful in writing block ${this.miningBlock} to mined_blocks`)
                }
            })
            await this.handleMinedBlock()
            await this.spendCoinbase(this.coinbase)
        })
    }
    async handleMinedBlock() {
        BlockObject.check(this.miningBlock)
        if (!BlockObject.guard(this.miningBlock)) {
            logger.info(`Mined block is incorrectly formatted %o`, this.miningBlock)
            throw Error(`Invalid formatted block produced by miner ${this.miningBlock}`)
        } else {
            await objectManager.put(this.miningBlock)
            let newBlock = await Block.fromNetworkObject(this.miningBlock)
            try {
                await newBlock.validate(network.peers[0])
            } catch (e) {
                throw Error(`Invalid semantic block produced by miner with error ${e}`)
            }
            logger.debug(`Mined block ${newBlock.blockid} validated succesfully, about to broadcast`)
            network.broadcast({type : 'object', object: this.miningBlock})
        }
    }
    async spendCoinbase(cb : any) {
        /* Wait 30 seconds to spend it. */
        await delay(1000 * 30)
        if (!TransactionObject.guard(cb)) {
            throw Error("Trying to spend mined block's coinbase but it was invalid")
        }
        let spendingObj = spendingTemplate
        if ('inputs' in spendingObj) {
            spendingObj.inputs[0].outpoint.txid = hash(canonicalize(cb))
            let spendingTx = Transaction.fromNetworkObject(spendingObj)
            let unsigned = spendingTx.toNetworkObject(false)
            console.log(`Unsigned spending Tx: ${unsigned}`)
            const privkeyBuffer = hex2uint8(this.privkey)
            const messageBuffer = Uint8Array.from(Buffer.from(canonicalize(unsigned), 'utf-8'))
            let sig = await ed.sign(messageBuffer, privkeyBuffer)
            spendingTx.inputs[0].sig = uint82hex(sig)
            if (!await ver(uint82hex(sig), canonicalize(unsigned), this.pubkey)) {
                throw Error("Something went wrong with signing tx that spends cb")
            }
            logger.debug("Successfully generated a new spending Tx from mined CB")
            network.broadcast({type: 'object', object: canonicalize(spendingTx.toNetworkObject())})

        } else {
            throw Error(`There are no inputs in the spending tx ${spendingObj}`)
        }
    }
}

export const miningManager = new MiningManager()