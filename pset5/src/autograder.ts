import net from 'net';
import { canonicalize } from "json-canonicalize";
import { Unknown } from 'runtypes';
import { objectManager } from './object';
import { hash } from './crypto/hash'
const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'

/*
Second block:
txs. Note that POW checking needs to be disabled for this.*/
const BLOCK1_OBJ = {"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671198937,"miner":"grader","nonce":"b1acf38984b35ae882809dd4cfe7abc5c61baa52e053b4c3643f204ef2954194","note":"Block 1","previd":"0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2","txids":["208aa95eaca2b3f862308ca8c85d7eac2efc974d8f05794c8381d2cc228c949e"],"type":"block"},"type":"object"}
const BLOCK1_CB_OBJ = {"object":{"height":1,"outputs":[{"pubkey":"b48a5d809726a7437798dc59bb9a0929119e478964dabb5c2fb7aee471bb6f63","value":50000000000000}],"type":"transaction"},"type":"object"}
const BLOCK2_IDS = ["e3deb876da2d31a22e6296df43151a8cfd616171a92025788f426a20003f71bf","5f20ec0d955f9e45b003813cc0f95f7449edeb6e6106741b13504611152d717c"]
const BLOCK2_OBJ = {"object":{"T":"00000000abc00000000000000000000000000000000000000000000000000000","created":1671198938,"miner":"grader","nonce":"b1acf38984b35ae882809dd4cfe7abc5c61baa52e053b4c3643f204f1f0c1c1f","note":"Block 2","previd":"000000001c603af375a8a86925020abc4cac64af0d097731ed70b261d986fec8","txids":[],"type":"block"},"type":"object"}
const BLOCK2_CB_OBJ = {"object":{"height":2,"outputs":[{"pubkey":"b48a5d809726a7437798dc59bb9a0929119e478964dabb5c2fb7aee471bb6f63","value":60000000000000}],"type":"transaction"},"type":"object"}
const BLOCK2_TX1_OBJ = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"208aa95eaca2b3f862308ca8c85d7eac2efc974d8f05794c8381d2cc228c949e"},"sig":"ba56d91d197fa7f64b65fe84c9fec865e19ef8ad5116d2df4180f372bf7d45ff995bea66b9166f5ab2e1e4f073a66d14e4bbd3f30db327f4cf4800aa0309bd01"}],"outputs":[{"pubkey":"b48a5d809726a7437798dc59bb9a0929119e478964dabb5c2fb7aee471bb6f63","value":40000000000000}],"type":"transaction"},"type":"object"}


/*Random*/
const VALID_CB = {"object":{"height":0,"outputs":[{"pubkey":"d43007aa3d153ea3bab2e7a1f3e4b29970710ec948bdc3fa2d6c80cd037df982","value":50000000000}],"type":"transaction"},"type":"object"}
const VALID_TX1 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"3603b7799cdcc756a428e3febd4879bfcef760e0fb5dc68bdf3e08e7ac272070"},"sig":"926bc682d78da967b3c497e33cad10c8b88e17ed5d2cbdfa53091b6cc56ab2ce6fe61e60dbc40a936130643cec0fd4c560dbfab3b6f41dc76c27a42f1f201807"}],"outputs":[{"pubkey":"d43007aa3d153ea3bab2e7a1f3e4b29970710ec948bdc3fa2d6c80cd037df982","value":10}],"type":"transaction"},"type":"object"}

function test_valid() {
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
            console.log(`Grader 1 received message ${i}th ${message}`)
            if (i === 3) {

              grader1.write(`${canonicalize(BLOCK1_OBJ)}\n${canonicalize(BLOCK1_CB_OBJ)}\n`)
              console.log(`Grader 1 sending block1 and valid coinbase`)
            }
            if (i === 5){
                grader1.write(`${canonicalize(BLOCK2_TX1_OBJ)}\n`)
                console.log(`Grader 1 sending a valid tx that should be added to mempool`)
            }
            if (i===6){
                let getmempool = {
                    type: "getmempool"
                }
                grader1.write(`${canonicalize(getmempool)}\n`)
            }
            // else if(i === 3) {
            //   let chaintip = {
            //     type: "object",
            //     object: BLOCK1
            //   }
            //   grader1.write(`${canonicalize(chaintip)}\n`)
            //   console.log(`Grader 1 sending valid chaintip block ${hash(canonicalize(BLOCK1))}`)
            // }
            // else if(i=== 4) {
            //   let genesis_obj = {
            //     type: "object",
            //     object: GENESIS
            //   }
            //   grader1.write(`${canonicalize(genesis_obj)}\n`)
            //   console.log(`Grader 1 sending valid genesis block ${hash(canonicalize(GENESIS))}`)
            // } else if(i === 5) {
            //   let block_tx = {
            //     type: "object",
            //     object: COINBASE
            //   }
            //   grader1.write(`${canonicalize(block_tx)}\n`)
            //   console.log(`Grader 1 sending valid coinbase in block 1 ${hash(canonicalize(COINBASE))}`)
            // } else if (i === 7) {
            //   let getchaintip = {
            //     type: "getchaintip"
            //   }
            //   grader1.write(`${canonicalize(getchaintip)}\n`)
            // }
          i++
        }
      })
    })
  }
test_valid()