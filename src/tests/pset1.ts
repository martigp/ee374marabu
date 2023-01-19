import net from 'net';
import delay from 'delay';
import { canonicalize } from "json-canonicalize";
import { send_hello, send_get_peers, tcp_responder} from '../marabu_ts/tcp';

const SERVER_PORT = 18018;
//Would just be the IP in the PSET / bootstrapping nodes
// const SERVER_HOST = '45.77.189.40';
const SERVER_HOST = '0.0.0.0';

const client_soc = new net.Socket();

function complete_handshake(client_soc: net.Socket) {
    let msg = `${canonicalize({"type": "hello", "version": "0.9.0"})}\n`
    client_soc.write(msg)
}


function test_complete_msg(client_soc: net.Socket, msg: string) {
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

function test_incomplete_msg(client_soc: net.Socket, msg1: string, msg2?: string) {
    console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`, async () => {
        client_soc.write(msg1);
        await delay(3000);
        if (msg2) {
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

// This function tests from the perspective of the grader
function check_getpeers_response(client_soc: net.Socket) {
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        complete_handshake(client_soc)

        let msg = `${canonicalize({"type": "getpeers"})}\n`;

        // client_soc.write(`${msg}`);

        client_soc.write(`${msg.slice(0,4)}`);
        await delay(3000);
        client_soc.write(`${msg.slice(4)}`);

    });    

    client_soc.on('data', (data) => {
        console.log(`tester received: ${data}`);
    });

    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });

    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });


    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });

    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });
}


// This function tests from the perspective of the grader
function check_timeout(client_soc: net.Socket) {
    client_soc.connect(SERVER_PORT, SERVER_HOST, async () => {
        console.log(`Connected to server ${SERVER_HOST}:${SERVER_PORT}`);
        complete_handshake(client_soc)

        let msg = `${canonicalize({"type": "getpeers"})}\n`;

        // client_soc.write(`${msg}`);

        client_soc.write(`${msg.slice(0,4)}`);
        await delay(50000);
        client_soc.write(`${msg.slice(4)}`);

    });    

    client_soc.on('data', (data) => {
        console.log(`tester received: ${data}`);
    });

    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });

    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });


    client_soc.on('error', (error) => {
        console.error(`Server Error: ${error}`);
    });

    client_soc.on('close', () => {
        console.log(`Server disconnected`);
    });
}

// RUN TESTS

// valid hello
// test_complete_msg(client_soc, `{"type":"hello", "version":"0.9.0"}`);

// Invalid initial message - expecting invalid handshake when run before all other messages
// TODO: FAILING THIS TEST
test_complete_msg(client_soc, `{"type":"jbh", "version":"0.9.0"}\n`)
// ----------------------

//Incomplete message - expecting improper format
// test_incomplete_msg(client_soc, `{"type":"hello", "ver)\n`);

//Invalid message because newline - expecting improper format
// test_complete_msg(client_soc, `{"type":"hello",\n "version":"0.8.0"}`);

// Invalid hello - expecting improper format
// test_complete_msg(client_soc, `{"type":"hello", "version":"jd3.x"}`)

// TODO: FAILING THIS TEST
// making sure getpeers responds appropriately even with an imperfect message
// check_getpeers_response(client_soc)

// TODO: FAILING THIS TEST
// should timeout after receiving partial message
// check_timeout(client_soc)