import net from 'net';
import { canonicalize } from "json-canonicalize";
import { Unknown } from 'runtypes';
import { objectManager } from './object';
import { hash } from './crypto/hash'


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
function test_in_future() {
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
    grader1.write(`${canonicalize(genesis_obj)}\n`)
    grader1.on('data', (data) => {
      console.log(`Grader 1 received ${data}`)
    })
    let future_block = BLOCK1
    future_block.created = (new Date().getTime() / 1000) + 1000000
    let block_1_obj = {
      type: "object",
      object: future_block
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)
  })
}

/* Have to disable PoW checks for this one */
function test_before_parent() {
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
    let before_parent_block = BLOCK1
    before_parent_block.created = GENESIS.created - 100
    let block_1_obj = {
      type: "object",
      object: before_parent_block
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)
  })
}

/* Have to change target to TEST_TARGET checks for this one */
function test_invalid_genesis() {
  const grader1 = new net.Socket();
  const grader2 = new net.Socket();
  grader2.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader2 successfully connected to IP address 
              ${grader2.remoteAddress} on port ${grader2.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 2","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader2.write((`${hello1}\n`));
    grader2.on('data', (data) => {
      console.log(`Grader 2 received ${data}`)
    })
  })

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
    let i = 0;
    grader1.on('data', (data) => {
      if (i === 2) {
        let invalid_genesis = {
          type: "object",
          object: INVALID_GENESIS
        }
        grader1.write(`${canonicalize(invalid_genesis)}\n`)
      }
      console.log(`Grader 1 received ${data}`)
      i++
    })
    let invalid_genesis = BLOCK1
    invalid_genesis.previd = hash(canonicalize(INVALID_GENESIS))
    let block_1_obj = {
      type: "object",
      object: invalid_genesis
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)

  })
}

function test_invalid_coinbase_height() {
  const grader1 = new net.Socket();
  const grader2 = new net.Socket();
  grader2.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader2 successfully connected to IP address 
              ${grader2.remoteAddress} on port ${grader2.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 2","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader2.write((`${hello1}\n`));
    grader2.on('data', (data) => {
      console.log(`Grader 2 received ${data}`)
    })
  })

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
    let i = 0;
    let invalid_coinbase = COINBASE
    invalid_coinbase.height = 2
    grader1.on('data', (data) => {
      if (i === 2) {
        let invalid_genesis = {
          type: "object",
          object: invalid_coinbase
        }
        grader1.write(`${canonicalize(invalid_genesis)}\n`)
      }
      console.log(`Grader 1 received ${data}`)
      i++
    })
    let invalid_coinbase_block = BLOCK1
    invalid_coinbase_block.txids[0] = hash(canonicalize(invalid_coinbase))
    let block_1_obj = {
      type: "object",
      object: invalid_coinbase_block
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)

  })
}

function test_invalid_pow() {
  const grader1 = new net.Socket();
  const grader2 = new net.Socket();
  grader2.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader2 successfully connected to IP address 
              ${grader2.remoteAddress} on port ${grader2.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 2","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader2.write((`${hello1}\n`));
    grader2.on('data', (data) => {
      console.log(`Grader 2 received ${data}`)
    })
  })

  grader1.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader1 successfully connected to IP address 
              ${grader1.remoteAddress} on port ${grader1.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 1","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader1.write((`${hello1}\n`));
    // Sending GENESIS
    let i = 0;
    let bad_pow_genesis = GENESIS;
    bad_pow_genesis.created += 100 // shoudl fail PoW statistically
    grader1.on('data', (data) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
          console.log(`Grader 1 received message ${message}`)
          if (i === 3) {
            let bad_genesis_obj = {
              type: "object",
              object: bad_pow_genesis
            }
            grader1.write(`${canonicalize(bad_genesis_obj)}\n`)
            console.log(`Grader 1 sending ${hash(canonicalize(bad_pow_genesis))}`)
          }
        i++
      }
    })
    let bad_block = BLOCK1
    bad_block.previd = hash(canonicalize(bad_pow_genesis))
    console.log(`Bad previd = ${bad_block.previd}`)
    console.log(`Genesis id = ${hash(canonicalize(GENESIS))}`)
    let block_1_obj = {
      type: "object",
      object: bad_block
    }
    grader1.write(`${canonicalize(block_1_obj)}\n`)

  })
}

function test_valid_chain_tip() {
  const grader1 = new net.Socket();
  const grader2 = new net.Socket();
  grader2.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader2 successfully connected to IP address 
              ${grader2.remoteAddress} on port ${grader2.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 2","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader2.write((`${hello1}\n`));
    grader2.on('data', (data) => {
      console.log(`Grader 2 received ${data}`)
    })
  })

  grader1.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Grader1 successfully connected to IP address 
              ${grader1.remoteAddress} on port ${grader1.remotePort}`);
    let hello1: String = canonicalize({"agent":"grader 1","type":"hello","version":"0.9.0"});
    console.log(`Sending message: ${hello1}`);
    grader1.write((`${hello1}\n`));
    // Sending GENESIS
    let i = 0
    grader1.on('data', (data) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
          console.log(`Grader 1 received message ${message}`)
          if (i === 2) {
            let chaintip_msg = {
              type: "chaintip",
              blockid: hash(canonicalize(BLOCK1))
            }
            grader1.write(`${canonicalize(chaintip_msg)}\n`)
            console.log(`Grader 1 sending valid chaintip msg ${hash(canonicalize(BLOCK1))}`)
          }
          else if(i === 3) {
            let chaintip = {
              type: "object",
              object: BLOCK1
            }
            grader1.write(`${canonicalize(chaintip)}\n`)
            console.log(`Grader 1 sending valid chaintip block ${hash(canonicalize(BLOCK1))}`)
          }
          else if(i=== 4) {
            let genesis_obj = {
              type: "object",
              object: GENESIS
            }
            grader1.write(`${canonicalize(genesis_obj)}\n`)
            console.log(`Grader 1 sending valid genesis block ${hash(canonicalize(GENESIS))}`)
          } else if(i === 5) {
            let block_tx = {
              type: "object",
              object: COINBASE
            }
            grader1.write(`${canonicalize(block_tx)}\n`)
            console.log(`Grader 1 sending valid coinbase in block 1 ${hash(canonicalize(COINBASE))}`)
          } else if (i === 7) {
            let getchaintip = {
              type: "getchaintip"
            }
            grader1.write(`${canonicalize(getchaintip)}\n`)
          }
        i++
      }
    })
  })
}


// test_in_future();
// test_before_parent();
// test_invalid_genesis();
//test_invalid_coinbase_height();
// Set the target to "900e7578d9850d1303f3edabb8825ec9ec3f0ed0cddefa581d4c0b1c8700e0b5"
// test_invalid_pow();
test_valid_chain_tip();

