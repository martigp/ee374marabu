import net from 'net';
import { canonicalize } from "json-canonicalize";
import { isHelloMessage } from './messages/hello';
import { IMessage } from './messages/message';

/*
This file defines some general TCP functions used by both server & cliet
such as sending a hello or processing data sent by their peer
*/

const HELLO = { "type": "hello", "version": "0.9.0", "agent" : ""};
const GET_PEERS = {"type": "getpeers"};

export function send_hello(socket: net.Socket, server: boolean) {
    let hello = HELLO;
    HELLO.agent = `Maribu ${server ? "Server" : "Client"} 0.9.0`;
    socket.write(`${canonicalize(hello)}\n`);
}

export function send_get_peers(socket: net.Socket) {
    socket.write(`${canonicalize(GET_PEERS)}\n`);
}

/*
Function that purely checks correct formatting i.e. correct fields
*/
export function valid_format(msg : IMessage) : boolean {
    if("type" in msg) {
        switch(msg.type) {
            case "hello": {
                // Parse Hello Message
                if(isHelloMessage(msg)) {
                    // Checks correct versioning, maybe should do this afterwards?
                    return /0\.9\..+/.test(msg.version);
                }
                break;
            };
            case "peers": {
                // Parse
                break;
            }
            case "get_peers": {
                return true;
            }
            // TODO: Handling with all Types
            default: {
                break;
            }
        }
    }
    return false;
};

export function process_msg(socket : net.Socket, msg: any) {
    //Process Based on Message Type e.g. Hello Should check version with process_hello
}