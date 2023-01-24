import { Input } from './input';
import { Output } from './output';
import { Literal, Record, String, Array, Union, Static, Null, Unknown, Number, Optional} from 'runtypes'
import { optional } from 'zod';


export const TxObject = Record({
    type: Literal('transaction'), 
    inputs : Array(Input),
    outputs : Array(Output)
}) 
export type TxObjectType = Static<typeof TxObject>

export const CoinbaseObject = Record({
    type: Literal('transaction'),
    height: Number,
    output: Array(Output)
})

export type CoinbaseObjectType = Static<typeof CoinbaseObject>

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
