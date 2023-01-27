import { Union, Record, String, Static, Number, Null} from 'runtypes'
import { logger } from '../logger';

export const Output = Record({
    pubkey: String,
    value : Number
})

export function validOutputFormat(output: OutputType) : boolean {
    // Check Sig and TxId
    if(!/[0-9a-f]{64}/.test(output.pubkey)) {
        logger.info(`Output Pubkey ${output.pubkey} not 64 hex chars`)
        return false;
    }
    if(output.value < 0) {
        logger.info(`Output Value ${output.value} less than 0`)
        return false;
    }
    return true;
}

export type OutputType = Static<typeof Output>