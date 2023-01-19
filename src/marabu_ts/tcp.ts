import net from 'net';
import fs from 'fs';
import { canonicalize } from "json-canonicalize";
import * as mess from './messages/message';
import { destroy_soc } from './error';
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
    HELLO.agent = `Marabu ${server ? "Server" : "Client"} 0.9.0`;
    socket.write(`${canonicalize(hello)}\n`);
    console.log(`${server ? "Server" : "Client"} hello sent`);
}

export function send_get_peers(socket: net.Socket) {
    socket.write(`${canonicalize(GET_PEERS)}\n`);
    console.log("Get peers sent")
}

export function send_peers(socket: net.Socket, peers: Array<string>) {
    console.log(`Sending peers:\n${peers}`);
    let peers_msg = PEERS;
    peers_msg.peers = peers;
    socket.write(`${canonicalize(peers_msg)}\n`);
}

export function tcp_responder(socket : net.Socket, buffer : string, hello_rcvd : boolean, server: boolean) {
    let msg_processor = new MarabuMessageProcessor();
    socket.on('data', (data) => {
        buffer += data;
        const messages = buffer.split('\n');
        console.log(`${server ? "Server" : "Client"} messages received: ${messages}`);
        // Empty string if last character is '\n'
        if (messages.length > 1) {
            // Catch any exceptions from JSON parsing
            try {
                if(!hello_rcvd) {
                    let first_msg : mess.IMessage = JSON.parse(messages[0]);
                    if(!msg_processor.process_first_msg(socket, first_msg, server)) {
                        buffer = ''
                        return;
                    }
                    hello_rcvd = true;
                }
                for(const message of messages.slice(Number(hello_rcvd), -1)) {
                    // Process each message accordingly
                    let json_msg = JSON.parse(message);
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
        console.error(`${server ? "Client" : "Server"} disconnected`);
    });
}
