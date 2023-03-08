import {hash} from './crypto/hash'
import { uint82hex } from './crypto/signature';
import { canonicalize } from 'json-canonicalize';
import { BlockObject } from './message';

const TARGET = '00000000abc00000000000000000000000000000000000000000000000000000'

function getNewNonce(nonce : Uint8Array) : Uint8Array {
    let index = nonce.length - 1;
    while (index >= 0) {
        nonce[index] += 1
        if (nonce[index] != 0)
            {
                return nonce
            }
        index -= 1
    }
    return getNewNonce( nonce)
}

try {
    let block = JSON.parse(process.argv[2])
    if(!BlockObject.guard(block)) {
        throw Error('Mining candidate valid block type')
    }
    let nonceHex = block.nonce
    let nonceArr = Uint8Array.from(Buffer.from(nonceHex, 'hex'))
    let blockid = hash(canonicalize(block))
    let ctr = 0
    while(true) {
        if (BigInt(`0x${blockid}`) <= BigInt(`0x${TARGET}`)) {
            console.log(nonceHex)
            break
        }
        nonceArr = getNewNonce(nonceArr)
        nonceHex = uint82hex(nonceArr)
        block.nonce = nonceHex
        blockid = hash(canonicalize(block))
        ctr++
    }
} 
catch (e) {
    console.log(`Coulldn't parse mining candidate`)
}