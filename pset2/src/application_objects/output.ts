import { Union, Record, String, Static, Number, Null} from 'runtypes'

export const Output = Record({
    pubkey: String,
    value : Number
})

export function validOutputFormat(output: OutputType) : boolean {
    // Check Sig and TxId
    return /[0-9af]{64}/.test(output.pubkey) && output.value >= 0;
}

export type OutputType = Static<typeof Output>