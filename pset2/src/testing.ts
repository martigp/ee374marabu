import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes';


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'

const client_soc = new net.Socket();

function test_ihaveobject_msg (client_soc: net.Socket) {
    console.log(`Connecting....`);
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        let message: String = canonicalize({"agent":"Malibu (pset1)","type":"hello","version":"0.9.0"}); 
        client_soc.write((`${message}\n`));

        let message1: string = canonicalize({"type": "ihaveobject", "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec"}); 
        client_soc.write((`${message1}\n`));
        
        let message2: string = canonicalize({
            "type": "object",
            "object": {
              "type": "block",
              "txids": [
                "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
              ],
              "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
              "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
              "created": "1622825642",
              "T": "003a000000000000000000000000000000000000000000000000000000000000"
            }
          }); 
        client_soc.write((`${message2}\n`));
    });
    client_soc.on('data', (data) => {
        console.log(`Server sent: ${data}`);
    });
    
    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });
    
    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });
};


function test_getobject (client_soc: net.Socket) {
    console.log(`Connecting....`);
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        let message: String = canonicalize({"agent":"Malibu (pset1)","type":"hello","version":"0.9.0"}); 
        client_soc.write((`${message}\n`));

        let message1: String = canonicalize({
            "type": "getobject",
            "objectid": "36496e13e8ad98f75321264b0a7980bfe25d4f1226ad1f8da1d8cdb82d8119ec"
          }); 
        client_soc.write((`${message1}\n`));
    
    });
    client_soc.on('data', (data) => {
        console.log(`Server sent: ${data}`);
    });
    
    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });
    
    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });
}

function test_shrek2 (obj: Object) {

    const object_canon: string = canonicalize(obj)
    var blake2 = require('blake2');
    var h = blake2.createHash('blake2s');
    h.update(Buffer.from(object_canon));
    var objectid = h.digest("hex")
    logger.info(`Attempting to hash hashed to ${objectid}`)
}

//test_getobject (client_soc); 

test_ihaveobject_msg (client_soc); 
/*test_shrek2({
    "type": "block",
    "txids": [
      "740bcfb434c89abe57bb2bc80290cd5495e87ebf8cd0dadb076bc50453590104"
    ],
    "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b",
    "previd": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd8",
    "created": "1622825642",
    "T": "003a000000000000000000000000000000000000000000000000000000000000"
  }); */