import net from 'net';
import fs from 'fs'
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

export function send_peers(socket: net.Socket, peers: any) {
    socket.write(`${canonicalize(peers)}\n`);
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
    switch(msg.type) { 
        case "hello": { 
           process_hello(msg); 
           break; 
        } 
        case "peers": { 
            process_peers(msg); 
           break; 
        } 
        case "getpeers": { 
            process_getpeers(socket); 
            break; 
         } 
        default: { 
           //statements; 
           break; 
        } 
     } 
}


export function process_peers(msg: any) { 
    //add the peers to our local json peers.json 
    let newPeers: string[] = msg.peers; 

    var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 

    var existingpeers = jsondata.peers; 

    var finalPeers: string[] = newPeers.concat(existingpeers); 
    
    const peersString = { //create JSON object 
        peers: finalPeers,
    }

    finalPeers = [...new Set([...newPeers,...existingpeers])]; //remove duplicates

    fs.writeFile("src/peers.json", JSON.stringify(peersString), err => { //update JSON file 
        if (err) console.log("Error Updating Peers: ", err);
      });

}

export function process_getpeers(socket : net.Socket) { //send a message with our peers when asked 
    var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 


    var existingpeers = jsondata.peers; 
    send_peers(socket, existingpeers);

}

export function process_hello(msg: any) {
    return /0\.9\..+/.test(msg.version);
}