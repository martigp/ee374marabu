import { Record, String, Static, Number, Null, Union} from 'runtypes'

export const Outpoint = Record({
    txid: String, 
    index : Number
})

export type OutpointType = Static<typeof Outpoint>

export const Input = Record({
    outpoint: Outpoint, 
    sig : Union(String,Null)
})

export type InputType = Static<typeof Input>