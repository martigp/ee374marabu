import { Union, Record, String, Static, Number, Null} from 'runtypes'

export const Output = Record({
    pubkey: String,
    value : Number
})

export type OutputType = Static<typeof Output>