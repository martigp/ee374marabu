import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes';


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'

const client_soc = new net.Socket();

function emulate_autograder(client_soc: net.Socket) { 
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);

        console.log(`Sending handshake`);
        let message: String = canonicalize({"agent":"Malibu (pset1)","type":"hello","version":"0.9.0"}); 
        client_soc.write((`${message}\n`));

        console.log(`Sending valid coinbase transaction`);
        let message1: String = canonicalize({"object":{"height":0,"outputs":[{"pubkey":"7578824af040dbeb6db5932d06c77443f57e8d3df2aeb04a9c899fa0f71da026","value":50000000000}],"type":"transaction"},"type":"object"}); 
        client_soc.write((`${message1}\n`));
        console.log(`Expecting to receive ihaveobject message`);

        console.log(`Sending getobject message`);
        let message2: String = canonicalize({"objectid":"54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c","type":"getobject"}); 
        client_soc.write((`${message2}\n`));
        console.log(`Expecting to receive object`);

        console.log(`Sending another valid transaction`);
        let message3: String = canonicalize({"object":{"inputs":[{"outpoint":{"index":0,"txid":"54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c"},"sig":"85b871a84944c876f81a4a495c76b1980b63007db4d3d562600ee375db030e41e7d33789c803d6a6f545b84aeae729e337be751a9677c77bacd49f288ad96e04"}],"outputs":[{"pubkey":"7578824af040dbeb6db5932d06c77443f57e8d3df2aeb04a9c899fa0f71da026","value":10}],"type":"transaction"},"type":"object"}); 
        client_soc.write((`${message3}\n`));
        console.log(`Expecting I have object message`);
        
        console.log(`Sending getobject message`);
        let message4: String = canonicalize({"objectid":"ea203aa2d8460c74251aa560d0f56e59470f186cfdc9d5b2fb824a8b2c3ede18","type":"getobject"}); 
        client_soc.write((`${message4}\n`));
        console.log(`Expecting to receive object`);

        console.log(`Sending ihaveobject message`);
        let message5: String = canonicalize({"objectid":"ea203aa2d8460c74251aa560d0f56e59470f186cfdc9d5b2fb824a8b2c3ede18","type":"ihaveobject"}); 
        client_soc.write((`${message5}\n`));
        console.log(`Expecting to receive object`);

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

emulate_autograder(client_soc); 
