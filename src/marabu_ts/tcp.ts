import net from 'net';
import { canonicalize } from "json-canonicalize";

/*
This file defines some general TCP functions used by both server & cliet
such as sending a hello or processing data sent by their peer
*/

const HELLO = { "type": "hello", "version": "0.9.0", "agent" : ""};
const GET_PEERS = {"type": "getpeers"};

export function send_hello(socket: net.Socket, server: boolean) {
    let hello = HELLO;
    HELLO.agent = `Maribu ${server ? "Server" : "Client"} 0.9`;
    socket.write(`${canonicalize(hello)}\n`);
}

export function send_get_peers(socket: net.Socket) {
    socket.write(`${canonicalize(GET_PEERS)}\n`);
}

export function valid_format(msg : any) : boolean {
    if(msg.has("type")) {
        switch(msg.type) {
            case "hello": {
                // Parse Hello
                if (msg.has("version") && /0\.9\..+/.test(msg.version)) {
                    return true;
                }
                break;
            };
            case "transaction": {
                // Parse
                break;
            }
            case "block": {
                break;
            }
            default: {
                break;
            }
        }
    }
    return false;
}