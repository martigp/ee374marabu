import net from 'net';
import fs from 'fs';
import { canonicalize } from "json-canonicalize";
import * as mess from './messages/message';
import { DEFAULT_TIMEOUT, destroy_soc } from './error';
import { MarabuMessageProcessor } from './msg_processor';

/*
This file defines some general TCP functions used by both server & cliet
such as sending a hello or processing data sent by their peer
*/

const HELLO = { "type": "hello", "version": "0.9.0", "agent" : ""};
const GET_PEERS = {"type": "getpeers"};
const PEERS = {"type": "peers", "peers": [""] };

export function send_hello(socket: net.Socket, server: boolean) {
    let hello = HELLO;
    HELLO.agent = `Maribu ${server ? "Server" : "Client"} 0.9.0`;
    socket.write(`${canonicalize(hello)}\n`);
    //console.log(`${server ? "Server" : "Client"} hello sent`);
}

export function send_get_peers(socket: net.Socket) {
    socket.write(`${canonicalize(GET_PEERS)}\n`);
}

export function send_peers(socket: net.Socket, peers: Array<string>) {
    let peers_msg = PEERS;
    peers_msg.peers = peers;
    socket.write(`${canonicalize(peers_msg)}\n`);
}

export function tcp_responder(socket : net.Socket, buffer : string, hello_rcvd : boolean, server: boolean) {
    socket.setTimeout(DEFAULT_TIMEOUT, ()=> {
        socket.destroy();
    });
    let msg_processor = new MarabuMessageProcessor();
    socket.on('data', (data) => {
        buffer += data;
        const messages = buffer.split('\n');
        console.log(`Remote ${server ? "Client" : "Server"} messages received: ${messages}`);
        // Empty string if last character is '\n'
        if (messages.length > 1) {
            // Catch any exceptions from JSON parsing
            console.log(hello_rcvd);
            console.log(messages[0]);
            let start_ind = 0;
            try {
                if(!hello_rcvd) {
                    let first_msg : mess.IMessage = JSON.parse(messages[0]);
                    if(!msg_processor.process_first_msg(socket, first_msg, server)) {
                        buffer = ''
                        return;
                    }
                    hello_rcvd = true;
                    start_ind = 1;
                }
                console.log()
                for(const message of messages.slice(start_ind, -1)) {
                    // Process each message accordingly
                    let json_msg = JSON.parse(message);
                    console.log(message);
                    if(!msg_processor.process_msg(socket, json_msg, server)) {
                        buffer = '';
                        return;
                    }
                }
            }
            catch(e) {
                console.log(e);
                destroy_soc(socket, "INVALID_FORMAT", "Message was invalid JSON format");
                buffer = '';
            }
        }
        buffer = messages[messages.length - 1];
    });

    socket.on('error', (error) =>{
        console.error(`${server ? "Client" : "Server"} error: ${error}`)
    });
    socket.on('close', () =>{
        console.error(`Remote ${server ? "Client" : "Server"} disconnected`);
    });
    socket.on('timeout', () =>{
        console.log("Timeout response called");
    }
    );
}
