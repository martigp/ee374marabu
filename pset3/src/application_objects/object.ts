import { Input, validInputFormat } from './input';
import { Output, validOutputFormat } from './output';
import { Literal, Record, String, Array, Union, Static, Null, Number, Optional} from 'runtypes'
import { logger } from '../logger'
import { canonicalize } from 'json-canonicalize';
import * as ed from '@noble/ed25519'
import { objectManager } from '../objectmanager';

const T = "00000000abc00000000000000000000000000000000000000000000000000000"


/*--------------------TX OBJECT AND RELATED FUNCTIONS----------------------*/
export const TxObject = Record({
    type: Literal('transaction'), 
    inputs : Array(Input),
    outputs : Array(Output)
}) 
export type TxObjectType = Static<typeof TxObject>

export function validTxFormat(tx : TxObjectType) : boolean {
    for (const input of tx.inputs) {
        if (!validInputFormat(input)) {
            return false;
        }
    }

    for (const output of tx.outputs) {
        if (!validOutputFormat(output)) {
            return false;
        }
    }
    return true;
}

export function verifySig(sig : string, noSigTx : any, pubkey: string) : Promise<boolean> {
    let char_array : string[] = canonicalize(noSigTx).split("");
    var hex_message = Uint8Array.from(char_array.map(x => x.charCodeAt(0)))
    return ed.verify(sig, hex_message, pubkey)
  }


/*-----------------COINBASE OBJECT AND RELATED FUNCTIONS-------------------*/
export const CoinbaseObject = Record({
    type: Literal('transaction'),
    height: Number,
    outputs: Array(Output)
})

export type CoinbaseObjectType = Static<typeof CoinbaseObject>

export function validCoinbaseFormat(coinbase : CoinbaseObjectType) : boolean {
    for (const output of coinbase.outputs) {
        if (!validOutputFormat(output)) {
            return false;
        }
    }
    return true;
}

/*-----------------BLOCK OBJECT AND RELATED FUNCTIONS-------------------*/
export const BlockObject = Record({
    type: Literal('block'),
    txids: Array(String),
    nonce: String,
    previd: Union(String, Null),
    created: Number,
    T: String,
    miner: Optional(String),
    note: Optional(String) 
  })

export type BlockObjectType = Static<typeof BlockObject>

/* Determines whether block has correct formatting such as correct target */
export function validBlockFormat(block : BlockObjectType) : boolean {
    for (const txid of block.txids) {
        if (!validObjectIdFormat(txid)) {
            logger.info(`Block with invalid format txid ${txid}`)
            return false;
        }
    }
    // Target checking
    if (block.T !== T) {
        logger.info(`Invalid target ${block.T}`)
        return false;
    }
    // Previd valid objectid if non-null
    if (block.previd) {
        if (!validObjectIdFormat(block.previd)) {
            logger.info(`Invalid target ${block.T}`)
            return false;
        }
    } else {
        logger.info(`Genesis candidate received`)
    }
    return true;
}

export function validPOW(block : BlockObjectType) {
    return objectManager.getObjectID(block) < T;
}

// Checks valid blake2 hash (64 lowercase Hex)
export function validObjectIdFormat(objectid : string) : boolean {
    return /[0-9a-f]{64}/.test(objectid);
}

export const ApplicationObject = Union(BlockObject, TxObject, CoinbaseObject); 
export type ApplicationObjectType = Static<typeof ApplicationObject>

export const ApplicationObjects = [BlockObject, TxObject, CoinbaseObject]
