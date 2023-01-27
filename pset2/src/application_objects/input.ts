import { Record, String, Static, Number, Null, Union} from 'runtypes'
import { logger } from '../logger'

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

    if( (!/[0-9a-f]{64}/.test(input.outpoint.txid))) {
        logger.info(`Invalid txid ${input.outpoint.txid}`)
        return false;
    }
    if (input.outpoint.index < 0) {
        logger.info(`Index ${input.outpoint.index} less than 0`)
        return false;
    }

    if (input.sig !== null && !/[0-9a-f]{128}/.test(input.sig)) {
        logger.info(`Index ${input.sig} not 128 hex chars`)
        return false;
    }
    return true;
}

export type InputType = Static<typeof Input>