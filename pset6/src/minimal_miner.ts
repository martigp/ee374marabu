import {hash} from './crypto/hash'
import { uint82hex } from './crypto/signature';
import { canonicalize } from 'json-canonicalize';
import { BlockObject } from './message';

const TARGET = '00000000abc00000000000000000000000000000000000000000000000000000'
const TEST_TARGET = '000000abc0000000000000000000000000000000000000000000000000000000'

function getNewNonce(nonce : Buffer) : Buffer {
    let index = nonce.length - 1;
    while (index >= 0) {
        nonce[index] += 1
        if (nonce[index] != 0)
            {
                return nonce
            }
        index--
    }
    return nonce
}

try {
    let block = JSON.parse(process.argv[2])
    if(!BlockObject.guard(block)) {
        throw Error('Mining candidate valid block type')
    }
    let nonceHex = block.nonce
    let nonceArr = Buffer.from(nonceHex, 'hex')
    let blockid = hash(canonicalize(block))
    while(true) {
        if (BigInt(`0x${blockid}`) <= BigInt(`0x${TEST_TARGET}`)) {
            console.log(nonceHex)
            break
        }
        nonceArr = getNewNonce(nonceArr)
        nonceHex = nonceArr.toString('hex')
        block.nonce = nonceHex
        blockid = hash(canonicalize(block))
    }
} 
catch (e) {
    console.log(`Coulldn't parse mining candidate`)
}