import { Input, validInputFormat } from './input';
import { Output, validOutputFormat } from './output';
import { Literal, Record, String, Array, Union, Static, Null, Unknown, Number, Optional} from 'runtypes'

export const TxObject = Record({
    type: Literal('transaction'), 
    inputs : Array(Input),
    outputs : Array(Output)
}) 
export type TxObjectType = Static<typeof TxObject>

export const CoinbaseObject = Record({
    type: Literal('transaction'),
    height: Number,
    outputs: Array(Output)
})

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

export type CoinbaseObjectType = Static<typeof CoinbaseObject>

export function validCoinbaseFormat(coinbase : CoinbaseObjectType) : boolean {
    for (const output of coinbase.outputs) {
        if (!validOutputFormat(output)) {
            return false;
        }
    }
    return true;
}

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

export const ApplicationObject = Union(BlockObject, TxObject, CoinbaseObject); 
export type ApplicationObjectType = Static<typeof ApplicationObject>

export const ApplicationObjects = [BlockObject, TxObject, CoinbaseObject]

export function checkValidObjectId( objectid : string ) : boolean {
    return /[0-9a-f]{64}/.test(objectid);
}
