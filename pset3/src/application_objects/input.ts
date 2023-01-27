import { Record, String, Static, Number} from 'runtypes'

export const Outpoint = Record({
    txid: String, 
    index : Number
})

export type OutpointType = Static<typeof Outpoint>

export const Input = Record({
    outpoint: Outpoint, 
    sig : String
})

export type InputType = Static<typeof Input>