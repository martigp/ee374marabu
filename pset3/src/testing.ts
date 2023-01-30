import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes';


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'
const GENESIS =  {
  T: "00000000abc00000000000000000000000000000000000000000000000000000",
  created: 1671062400,
  miner: "Marabu",
  nonce: "000000000000000000000000000000000000000000000000000000021bea03ed",
  note: "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
  previd: null,
  txids: [],
  type: "block"
}
const BLOCK1 = {
  T: "00000000abc00000000000000000000000000000000000000000000000000000",
  created: 1671148800,
  miner: "Marabu Bounty Hunter",
  nonce: "15551b5116783ace79cf19d95cca707a94f48e4cc69f3db32f41081dab3e6641",
  note: "First block on genesis, 50 bu reward",
  previd: "0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2",
  txids: [
    "8265faf623dfbcb17528fcd2e67fdf78de791ed4c7c60480e8cd21c6cdc8bcd4"
  ],
  type: "block"
}

const BLOCK1_TX = {
  type: "transaction",
  height: 1,
  outputs: [
    {
      pubkey: "daa520a25ccde0adad74134f2be50e6b55b526b1a4de42d8032abf7649d14bfc",
      value: 50000000000000
    } 
  ]
}


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
    test_soc.on('data', (data) => {
      console.log(`Server sent ${data}`)
    })
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
        "created": 167106240,
        "miner": "Marabu",
        "nonce": "000000000000000000000000000000000000000000000000000000021bea03ed",
        "note": "The New York Times 2022-12-13: Scientists Achieve Nuclear Fusion Breakthrough With Blast of 192 Lasers",
        "previd": null,
        "txids": [],
        "type": "block"
      }
    };

    test_soc.write(`${canonicalize(block)}\n`);
    test_soc.on('data', (data) => {
      console.log(`Server sent ${data}`)
    })
  });
}

function test_getting_tx() {
  const grader1 = new net.Socket();
  const grader2 = new net.Socket();
  grader1.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader1 successfully connected to IP address 
              ${grader1.remoteAddress} on port ${grader1.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 1","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader1.write((`${hello1}\n`));
    // Sending GENESIS
    let genesis_obj = {
      type: "object",
      object: GENESIS
    }
    grader1.write(`${canonicalize(genesis_obj)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received ${data}`)
    })
    let block_1_obj = {
      type: "object",
      object: BLOCK1
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)
})
grader2.connect(SERVER_PORT, SERVER_HOST, () => {
  console.log(`Grader1 successfully connected to IP address 
            ${grader2.remoteAddress} on port ${grader1.remotePort}`);
  let hello1: String = canonicalize({"agent":"grader 2","type":"hello","version":"0.9.0"});
  console.log(`Sending message: ${hello1}`);
  grader2.write((`${hello1}\n`));
  // Sending GENESIS
  let i = 0
  grader2.on('data', (data)=> {
    console.log(`Grader 2 msg ${i} received ${data}`)
    if (i === 1) {
      let tx_obj = {
        type : 'object',
        object: BLOCK1_TX
      }
      grader2.write((`${canonicalize(tx_obj)}\n`));
    }
    i++
  })
})

}
// test_invalid_block_target();
// test_invalid_pow();
test_getting_tx();