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

export function validInputFormat(input: InputType) : boolean {
    // Check Sig and TxId
    // Check txid 
    if( (!/[0-9a-f]{64}/.test(input.outpoint.txid)) || input.outpoint.index < 0) {
        return false;
    }

    // Only checking formatting, null signature is not FORMAT ERROR
    return input.sig === null ? true : /[0-9af]{128}/.test(input.sig)
}

export type InputType = Static<typeof Input>