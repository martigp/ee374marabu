import net from 'net';
import { canonicalize } from "json-canonicalize";

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

const BLOCK0 = 
{
    type: "object",
    object: {
        "T":"00000000abc00000000000000000000000000000000000000000000000000000",
        "created":1671469958,
        "miner":"grader",
        "nonce":"5000000000000000000000000000000000000000000000000000000012c667a8",
        "note":"This block has a coinbase transaction",
        "previd":"0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2",
        "txids":["85b72002ffacb4f5e309b772098ba02391df90803c1c814c45cff8053f4e16ff"],
        "type":"block"
    }
}

const BLOCK0_TX1 = {
    object: { "height":1,
              "outputs":
                [
                    {"pubkey":"48414ac18e4c03202584769a543381856290d9f950ecc3063311bbaa8ef7a639",
                    "value":50000000000000}
                ],
            "type":"transaction"
    },
    type: "object"
}

const BLOCK1 = {
    "object":{ 
        "T":"00000000abc00000000000000000000000000000000000000000000000000000",
        "created":1671470413,
        "miner":"grader",
        "nonce":"100000000000000000000000000000000000000000000000000000000c6bccff",
        "note":"This block violates the law of conservation",
        "previd":"0000000087aa358369304cf750fddfccf6d66fe04344d090b27af51213c1b5c0",
        "txids":["5511abce2e64f90da983b2a103623e49c49aa6f62706be0b59ab47306c965db4",
        "e2095e1c75a0950c1d699287b15ba976ba39c8d0989c4c6c2457c38a9bb6330c"],
        "type":"block"},
    "type":"object"
}

const BLOCK1_TX0 = {
    object:{"height":2,"outputs":[{"pubkey":"a1f947ad8bdacb2ce828001f53114a114877c7f544d6648f68b1ad498699492e","value":80000000000000}],"type":"transaction"},
    type:"object"
}

const BLOCK1_TX1 = {"object":{"inputs":[{"outpoint":{"index":0,"txid":"85b72002ffacb4f5e309b772098ba02391df90803c1c814c45cff8053f4e16ff"},"sig":"d54a3b35b0daa86a4ae3c628392479429bd47beb5914308af4490dae2fa8296150019746d1a89eaf64f444eb02c3ee825e2928f47f0a6941434ed657a5349003"}],"outputs":[{"pubkey":"4b7cf4265981a6349bfae6396b4785c051909a2759925b9f5f6033550df13d6f","value":40000000000000}],"type":"transaction"},
"type":"object"}



function autograder_invalid_conservation() {
    const grader1 = new net.Socket();
    const grader2 = new net.Socket();
    grader1.connect(SERVER_PORT, SERVER_HOST, () => {
      console.log(`Grader1 successfully connected to IP address 
                ${grader1.remoteAddress} on port ${grader1.remotePort}`);
      let hello1: String = canonicalize({"agent":"grader 1","type":"hello","version":"0.9.0"});
      console.log(`Sending message: ${hello1}`);
      grader1.write((`${hello1}\n`));
      // Sending GENESIS
    //   let genesis_obj = {
    //     type: "object",
    //     object: GENESIS
    //   }
    //   grader1.write(`${canonicalize(genesis_obj)}\n`)
      let i = 0
      grader1.on('data', (data) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
            console.log(`Grader1 received message ${message}`);
            if (i == 1) {
                let msg = canonicalize(BLOCK0)
                console.log(`Sending message: ${msg}`);
                grader1.write((`${canonicalize(BLOCK0)}\n`));
            } else if (i == 2) {
                let msg = canonicalize(BLOCK0_TX1)
                console.log(`Sending message: ${msg}`);
                grader1.write((`${canonicalize(BLOCK0_TX1)}\n`));
            } else if (i == 4) {
                let msg = canonicalize(BLOCK1)
                console.log(`Sending message: ${msg}`);
                grader1.write((`${canonicalize(BLOCK1)}\n`));
            } else if (i== 5) {
                let msg = canonicalize(BLOCK1_TX0)
                console.log(`Sending message: ${msg}`);
                grader1.write((`${canonicalize(BLOCK1_TX0)}\n`));
            } else if (i== 7) {
                let msg = canonicalize(BLOCK1_TX1)
                console.log(`Sending message: ${msg}`);
                console.log(`Sending invalid block!`)
                grader1.write((`${canonicalize(BLOCK1_TX1)}\n`));
            }
            i += 1
        }
      })
  })
}
autograder_invalid_conservation()