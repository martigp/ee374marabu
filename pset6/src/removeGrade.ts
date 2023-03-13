import { network } from "./network"
import { TransactionObjectType, TransactionObject } from "./message"
import { hash } from "./crypto/hash"
import { canonicalize } from "json-canonicalize"
import { hex2uint8, uint82hex, ver} from "./crypto/signature"
import { Transaction } from "./transaction"
import * as ed from '@noble/ed25519'
import { logger } from "./logger"

const spendingTemplate : TransactionObjectType = {
    inputs:[{
        outpoint:{
            index: 0,
            txid: "cd2a573b029934779081363c0cb00b9897fff97319f062be555d2eb3e53a5f10" 
        },
        sig: null
    }],
    outputs:[{
        pubkey:"3f0bc71a375b574e4bda3ddf502fe1afd99aa020bf6049adfe525d9ad18ff33f",
        value:50000000000000
    }],
    type:"transaction"
}

const input_txid = "cd2a573b029934779081363c0cb00b9897fff97319f062be555d2eb3e53a5f10"
const privkey = "fd3ccb8f63b3ec0723bcff2ec12f5fcd6d387e4cac51cda91700ca4c2b9546bf"
const pubkey = "0b408baba65499b7c7df2cc07addf37195e70bf5a2f264c4a83fded7fecbaf60"

async function spendCoinbase() {
    let spendingObj = spendingTemplate
    if ('inputs' in spendingObj) {
        spendingObj.inputs[0].outpoint.txid = input_txid
        let spendingTx = Transaction.fromNetworkObject(spendingObj)
        let unsigned = spendingTx.toNetworkObject(false)
        console.log(`Unsigned spending Tx: ${unsigned}`)
        const privkeyBuffer = hex2uint8(privkey)
        const messageBuffer = Uint8Array.from(Buffer.from(canonicalize(unsigned), 'utf-8'))
        let sig = await ed.sign(messageBuffer, privkeyBuffer)
        spendingTx.inputs[0].sig = uint82hex(sig)
        if (!await ver(uint82hex(sig), canonicalize(unsigned), pubkey)) {
            throw Error("Something went wrong with signing tx that spends cb")
        }
        logger.debug("Successfully generated a new spending Tx from mined CB")
        network.broadcast({type: 'object', object: spendingTx.toNetworkObject()})

    } else {
        throw Error(`There are no inputs in the spending tx ${spendingObj}`)
    }
}
async function signHonest()
{
    let honest_message = "I am an honest peer."
    const privkeyBuffer = hex2uint8(privkey)
    const messageBuffer = Uint8Array.from(Buffer.from(honest_message, 'utf-8'))
    let sig = await ed.sign(messageBuffer, privkeyBuffer)
    if (!await ver(uint82hex(sig), honest_message, pubkey)) {
        throw Error("Something went wrong with signing tx that spends cb")
    }
    console.log(uint82hex(sig))
}

signHonest()