import net from 'net';
import { canonicalize } from "json-canonicalize";
import { Unknown } from 'runtypes';
import { objectManager } from './object';
import { hash } from './crypto/hash'
import { delay } from './promise';


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

const INVALID_GENESIS =  {
  T: "00000000abc00000000000000000000000000000000000000000000000000000",
  created: 1671062400,
  miner: "Marabu",
  nonce: "000000000000000000000000000000000000000000000000000000021bea03ed",
  note: "Not Genesis",
  previd: null,
  txids: [],
  type: "block"
}


let BLOCK1 = {
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
const coinbase = {
  type: "transaction",
  height: 1,
  outputs: [
    {
      pubkey: "8265faf623dfbcb17528fcd2e67fdf78de791ed4c7c60480e8cd21c6cdc8bcd4",
      value: 50000000000000
    } 
  ]
}

const transaction_spends_coinbase = {
  type: "transaction",
  height: 1,
  outputs: [
    {
      pubkey: "daa520a25ccde0adad74134f2be50e6b55b526b1a4de42d8032abf7649d14bf6",
      value: 50000000000000
    } 
  ],
  inputs: [
    {
      "outpoint": {
        "txid": "8265faf623dfbcb17528fcd2e67fdf78de791ed4c7c60480e8cd21c6cdc8bcd4",
        "index": 0
      },
      "sig": "3869a9ea9e7ed926a7c8b30fb71f6ed151a132b03fd5dae764f015c98271000e7da322dbcfc97af7931c23c0fae060e102446ccff0f54ec00f9978f3a69a6f0f"
    }
  ],
}
let COINBASE = {
  type: "transaction",
  height: 1,
  outputs: [
    {
      pubkey: "daa520a25ccde0adad74134f2be50e6b55b526b1a4de42d8032abf7649d14bfc",
      value: 50000000000000
    } 
  ]
}

/* Have to disable PoW checks for this one */
function test_getmempool_and_getchaintip() {
  const grader1 = new net.Socket();
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
    let getmem = {
      type: "getmempool",
    }
    grader1.write(`${canonicalize(genesis_obj)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after genesis ${data}`)
    })
    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after getmem ${data}`)
    })
    let block = BLOCK1
    let block_1_obj = {
      type: "object",
      object: block
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after first block ${data}`)
    })
    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after get mem${data}`)

    })
    let coin_obj = coinbase
    let block_1_ = {
      type: "object",
      object: coin_obj
    }
    grader1.write(`${canonicalize(block_1_)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after coinbase${data}`)
    })
    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after get mem ${data}`)

    })

    let transaction_spends_coinbase_ = transaction_spends_coinbase
    let transaction_spends_coinbase_obj = {
      type: "object",
      object: transaction_spends_coinbase_
    }
    grader1.write(`${canonicalize(transaction_spends_coinbase_obj)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after transaction ${data}`)
    })
    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received after getmem ${data}`)

    })
    let gettip = {
      type: "getchaintip",
    }

    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received ${data}`)

    })
    grader1.write(`${canonicalize(gettip)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received ${data}`)
    })
    grader1.write(`${canonicalize(getmem)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received ${data}`)

    })
  })
}


test_getmempool_and_getchaintip();

