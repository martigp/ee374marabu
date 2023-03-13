import {hash} from './crypto/hash'
import { uint82hex } from './crypto/signature';
import { canonicalize } from 'json-canonicalize';
import { BlockObject } from './message';

const TARGET = '00000000abc00000000000000000000000000000000000000000000000000000'
const TEST_TARGET = '100000abc0000000000000000000000000000000000000000000000000000000'

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
    let part1 = process.argv[2]
    let nonceHex = process.argv[3]
    let part2 = process.argv[4]
    let nonceArr = Buffer.from(nonceHex, 'hex')
    let blockid = hash(part1 + nonceHex + part2)
    while(true) {
        if (BigInt(`0x${blockid}`) <= BigInt(`0x${TARGET}`)) {
            console.log(nonceHex)
            break
        }
        nonceArr = getNewNonce(nonceArr)
        nonceHex = nonceArr.toString('hex')
        blockid = hash(part1 + nonceHex + part2)
    }
} 
catch (e) {
    console.log(`Coulldn't parse mining candidate`)
}