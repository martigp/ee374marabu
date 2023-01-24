import { Input } from './input';
import { Output } from './output';
import { Literal, Record, String, Array, Union, Static, Void, Unknown, Number} from 'runtypes'
import { optional } from 'zod';


export const TxObject = Record({
    type: Literal('transaction'), 
    inputs : Array(Input),
    outputs : Array(Output)
}) 

export type TxObjectType = Static<typeof TxObject>

export const BlockObject = Record({
    type: Literal('block'),
    txids: Array(String),
    nonce: String,
    previd: String,
    created: Number,
    T: String
    //miner: String,
    //note: String
  })

export type BlockObjectType = Static<typeof BlockObject>

export const ApplicationObject = Union(BlockObject, TxObject); 
export type ApplicationObjectType = Static<typeof ApplicationObject>

export const ApplicationObjects = [BlockObject, TxObject]
