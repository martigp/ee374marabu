import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes';


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'

function test_invalid_block_target() {
  const test_soc = new net.Socket();
    test_soc.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader1 successfully connected to IP address 
    ${test_soc.remoteAddress} on port ${test_soc.remotePort}`);
    let hello1: String = canonicalize({"agent":"G Test","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    test_soc.write((`${hello1}\n`));
    let invalid_target_block = {
      "type" : "object",
      "object" : {
        "type": "block",
        "txids": ["740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"],
        "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
        "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
        "created": 1622825642,
        "T": "003a000000000000000000000000000000000000000000000000000000000000",
        "miner": "dionyziz",
        "note": "A sample block"
      }
    };
    test_soc.write(`${canonicalize(invalid_target_block)}\n`);
  });
}

function test_invalid_pow() {
  const test_soc = new net.Socket();
    test_soc.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader1 successfully connected to IP address 
    ${test_soc.remoteAddress} on port ${test_soc.remotePort}`);
    let hello1: String = canonicalize({"agent":"G Test","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    test_soc.write((`${hello1}\n`));
    let block = {
      "type" : "object",
      "object" : {
        "T": "00000000abc00000000000000000000000000000000000000000000000000000",
        //missing 0 on created
        "created": 1671062400,
        "miner": "Marabu",
        "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
        "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
        "previd": null,
        "txids": [],
        "type": "block"
      }
    };
    test_soc.write(`${canonicalize(block)}\n`);
  });
}

test_invalid_block_target();
test_invalid_pow();