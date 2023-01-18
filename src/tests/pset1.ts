import net from 'net';
import delay from 'delay';
import { canonicalize } from "json-canonicalize";
import test from 'node:test';

const SERVER_PORT = 18018;
//Would just be the IP in the PSET / bootstrapping nodes
const SERVER_HOST = '45.77.189.40';

const client_soc = new net.Socket();

function test_complete_msg (client_soc: net.Socket, msg : string) {
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        client_soc.write(msg);
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

function test_incomplete_msg(client_soc: net.Socket, msg1 : string, msg2? : string) {
    console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`, async () => {
        client_soc.write(msg1);
        await delay(3000);
        if(msg2) {
            client_soc.write(msg2);
        }
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

//Incomplete message
test_incomplete_msg(client_soc,`{"type":"hello", "ver)\n`);
//INvalid message because newline
test_complete_msg(client_soc, `{"type":"hello",\n "version":"0.8.0"}`);
// Invalid hello
test_complete_msg(client_soc, `{"type":"hello", "version":"jd3.x"}`)