import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes';
import { EventEmitter } from "node:events";

const event_emitter = new EventEmitter()


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'
// const SERVER_HOST = '45.77.189.40'

const GRADER: string = process.argv[2]
// const SERVER_HOST = '45.77.189.40'

const client_soc = new net.Socket();

// 
function test_ihaveobject_msg(client_soc: net.Socket) {
  console.log(`Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    client_soc.on('data', (data) => {
      console.log(data);
    });

    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));

    let message1: String = canonicalize({ "type": "ihaveobject", "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec" });
    console.log(`${GRADER} sending ihaveobject`)
    client_soc.write((`${message1}\n`));

    let message2: String = canonicalize({
      "type": "object",
      "object": {
        "type": "block",
        "txids": [
          "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
        ],
        "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
        "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
        "created": 1622825642,
        "T": "003a000000000000000000000000000000000000000000000000000000000000"
      }
    });
    console.log(`${GRADER} sending block object`)
    client_soc.write((`${message2}\n`));
  });

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
};


function test_getobject(client_soc: net.Socket) {
  console.log(`Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));

    let message1: String = canonicalize({
      "type": "getobject",
      "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec"
    });
    console.log(`${GRADER} sending getobject`)
    client_soc.write((`${message1}\n`));

  });

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

function test_shrek2(obj: Object) {

  const object_canon: string = canonicalize(obj)
  var blake2 = require('blake2');
  var h = blake2.createHash('blake2s');
  h.update(Buffer.from(object_canon));
  var objectid = h.digest("hex")
  logger.info(`Attempting to hash - hashed to ${objectid}`)
}

function test_transactions(client_soc: net.Socket) {
  console.log(`${GRADER} Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));
    // let get_peers : String = canonicalize({"type":"getpeerz"});
    //client_soc.write((`${get_peers}\n`));
    let getbojectmsg: String = canonicalize({
      "type": "getobject",
      "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec"
    });
    console.log(`${GRADER} sending getobject`)
    client_soc.write((`${getbojectmsg}\n`));


    let message1: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 50000000000
        }
        ],
        "height": 0,
      }
    });
    console.log(`${GRADER} sending coinbase object`)
    client_soc.write((`${message1}\n`));

    let message2: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "inputs": [{
          "outpoint": {
            "index": 0,
            "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
          },
          "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
        }],
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 10
        }]
      }
    });
    console.log(`${GRADER} sending transaction object`)
    client_soc.write((`${message2}\n`));


  });

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

function test_invalid_transaction(client_soc: net.Socket) {
  console.log(`${GRADER} Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));

    let message1: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 50000000000
        }
        ],
        "height": 0,
      }
    });
    console.log(`${GRADER} sending coinbase transaction object`)
    client_soc.write((`${message1}\n`));

    // pset 2 - test for invalid signature, invalid outpoint (index too large), violation of weak law of conservation, and invalid format for all other issues
    let message2: String = '';
    const invalid_case: String = process.argv[4]
    switch (invalid_case) {
      case "signature": {
        console.log(`${GRADER} expecting invalid signature`)
        message2 = canonicalize({
          "type": "object",
          "object": {
            "type": "transaction",
            "inputs": [{
              "outpoint": {
                "index": 0,
                "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
              },
              // Changed final digit from 5 to 6
              "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c406"
            }],
            "outputs": [{
              "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
              "value": 10
            }]
          }
        });
        break;
      }
      case "outpoint": {
        console.log(`${GRADER} expecting invalid outpoint`)
        message2 = canonicalize({
          "type": "object",
          "object": {
            "type": "transaction",
            "inputs": [{
              "outpoint": {
                "index": 100000000000000000000000000000000000000000000000,
                "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
              },
              "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
            }],
            "outputs": [{
              "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
              "value": 10
            }]
          }
        });
        break;
      }
      case "conservation": {
        console.log(`${GRADER} expecting invalid conservation`)
        message2 = canonicalize({
          "type": "object",
          "object": {
            "type": "transaction",
            "inputs": [{
              "outpoint": {
                "index": 0,
                "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
              },
              "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
            }],
            "outputs": [{
              "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
              "value": 100000000000000000000000000000000000000000000000000000000000000
            }]
          }
        });
        break;
      }
      // TODO: vary the error in this case to test for all forms of improper format
      case "other": {
        console.log(`${GRADER} expecting invalid format`)
        message2 = canonicalize({
          "type": "object",
          "object": {
            "type": "transaction",
            "inputs": [{
              "outpoint": {
                "index": 0,
                "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
              },
              "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
            }],
            "outputs": [{
              "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
              "value": 10
            }]
          }
        });
        break;
      }
      default: {
        console.log("type of invalid test not specified");
        break;
      }
    }
    console.log(`${GRADER} sending INVALID transaction object: ${message2}`)
    client_soc.write((`${message2}\n`));
  });

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

function test_gossip_1(client_soc: net.Socket) {
  console.log(`${GRADER} Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));

    let message1: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 50000000000
        }
        ],
        "height": 0,
      }
    });
    console.log(`${GRADER} sending coinbase transaction object`)
    client_soc.write((`${message1}\n`));

    console.log(`run grader2 first before running grader1`)
    let message2: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "inputs": [{
          "outpoint": {
            "index": 0,
            "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
          },
          "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
        }],
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 10
        }]
      }
    });
    console.log(`${GRADER} sending transaction object`)
    client_soc.write((`${message2}\n`));
  })

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

function test_gossip_2(client_soc: net.Socket) {
  console.log(`${GRADER} Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`${GRADER} expecting to receive ihaveobject gossip`)
  });

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

function test_coinbase_gossip_1(client_soc: net.Socket) {
  console.log(`${GRADER} Connecting....`);
  client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
    console.log(`${GRADER} Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

    let message: String = canonicalize({ "agent": "Malibu (pset1)", "type": "hello", "version": "0.9.0" });
    console.log(`${GRADER} sending hello`)
    client_soc.write((`${message}\n`));

    console.log(`run grader2 first before running grader1`)
    let message1: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 50000000000
        }
        ],
        "height": 0,
      }
    });
    console.log(`${GRADER} sending coinbase transaction object`)
    client_soc.write((`${message1}\n`));

    let message2: String = canonicalize({
      "type": "object",
      "object": {
        "type": "transaction",
        "inputs": [{
          "outpoint": {
            "index": 0,
            "txid": "b303d841891f91af118a319f99f5984def51091166ac73c062c98f86ea7371ee"
          },
          "sig": "060bf7cbe141fecfebf6dafbd6ebbcff25f82e729a7770f4f3b1f81a7ec8a0ce4b287597e609b822111bbe1a83d682ef14f018f8a9143cef25ecc9a8b0c1c405"
        }],
        "outputs": [{
          "pubkey": "958f8add086cc348e229a3b6590c71b7d7754e42134a127a50648bf07969d9a0",
          "value": 10
        }]
      }
    });
    console.log(`${GRADER} sending transaction object`)
    client_soc.write((`${message2}\n`));
  })

  client_soc.on('data', (data) => {
    console.log(`Server sent: ${data} to ${GRADER}`);
  });

  client_soc.on('error', (error) => {
    console.error(`${GRADER} - Server Error: ${error}`);
  });

  client_soc.on('close', () => {
    console.log(`Server disconnected from ${GRADER}`);
  });
}

const TEST_CASE: String = process.argv[3]
console.log(TEST_CASE);

switch (TEST_CASE) {
  case "transactions": {
    test_transactions(client_soc);
    break;
  }
  case "invalidtransaction": {
    test_invalid_transaction(client_soc);
    break;
  }
  case "getobject": {
    test_getobject(client_soc);
    break;
  }
  case "ihaveobject": {
    test_ihaveobject_msg(client_soc);
    break;
  }
  case "shrek2": {
    test_shrek2({
      "type": "block",
      "txids": [
        "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
      ],
      "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
      "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
      "created": "1622825642",
      "T": "003a000000000000000000000000000000000000000000000000000000000000"
    });
    break;
  }
  case "gossip1": {
    test_gossip_1(client_soc);
    break;
  }
  case "coinbasegossip1": {
    test_coinbase_gossip_1(client_soc);
    break;
  }
  case "gossip2": {
    test_gossip_2(client_soc);
    break;
  }


  default: {
    console.log("test not specified");
    break;
  }
}