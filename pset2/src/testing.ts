import net from 'net';
import { canonicalize } from "json-canonicalize";


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'

const client_soc = new net.Socket();

function test_complete_msg (client_soc: net.Socket) {
    console.log(`Connecting....`);
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        let message: String = canonicalize({"agent":"Malibu (pset1)","type":"hello","version":"0.9.0"}); 
        client_soc.write((`${message}\n`));

        let message1: String = canonicalize({
            "type": "ihaveobject",
            "objectid": "0024839ec9632d382486ba7aac7e0bda3b4bda1d4bd79be9ae78e7e1e813ddd5"
          }); 
        client_soc.write((`${message1}\n`));

        let message2: String = canonicalize({"object":{"height":0,"outputs":[{
            "pubkey":"8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
            "value":50000000000}],"type":"transaction"},"type":"object"}); 
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

test_complete_msg (client_soc); 



