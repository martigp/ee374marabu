import { Record, String, Static, Number} from 'runtypes'

export const Output = Record({
    pubkey: String, 
    value : Number
})

export type OutputType = Static<typeof Output>