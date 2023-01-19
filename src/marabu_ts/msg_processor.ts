import * as mess from "./messages/message"
import net from 'net';
import { destroy_soc } from "./error";
import { send_peers } from "./tcp";
import fs from 'fs';
export class MarabuMessageProcessor {
    constructor() {}

    private process_hello(msg: mess.IHelloMessage) : boolean {
        return /0\.9\..+/.test(msg.version);
    }

    private process_getpeers(socket : net.Socket) : boolean { //send a message with our peers when asked 
        try {
            var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8'));
            var existingpeers = jsondata.peers; 
            send_peers(socket, existingpeers);
        }
        catch(e) {
            console.log("Couldn't read from peers.json");
        }
        return true;
    }
    
    private process_peers(msg: mess.IPeersMessage) : boolean { 
        //add the peers to our local json peers.json 
        let new_peers: string[] = msg.peers;
        try {
            var json_data = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 
    
            var existing_peers = json_data.peers; 
            
            let new_valid_peers: string[] = []; 

            for (let peer_id of new_peers) {
                if(check_marabu_peer(peer_id)){ 
                    new_valid_peers.push(peer_id); 
                }
              }
            var final_peers: string[] = new_valid_peers.concat(existing_peers); 
        
            final_peers = [...new Set([...new_valid_peers,...existing_peers])];
        
            const peersString = { //create JSON object 
                peers: final_peers,
            }
            fs.writeFileSync("src/peers.json", JSON.stringify(peersString));
        }
        catch(e) {
            // Don't destroy socket in these cases, should this be a little less crude
            // i.e. deal with each of the different errors ranging from reading to parsing
            // Maybe an internal error and close it!
            console.log("Couldn't read from process peers");
            console.error(e);
        }

        return true;
    
    }

    /*
    Processes the first message received and checks if valid format and if
    the message is a hello
    */
    process_first_msg(socket: net.Socket, msg : any, server: boolean) : boolean {
        let valid_format : boolean = false;
        if("type" in msg) {
            switch(msg.type) {
                case "hello": {
                    let parsed_msg = mess.zHelloMessage.safeParse(msg);
                    if(parsed_msg.success) {
                        if(!this.process_hello(parsed_msg.data)) {
                            destroy_soc(socket, "INVALID_FORMAT", `Invalid Hello Version`);
                            return false;
                        }
                        console.log(`${server ? "Server" : "Client"} Hello Received`);
                        return true;
                    }
                };
                case "peers": {
                    valid_format = mess.zPeersMessage.safeParse(msg).success;
                    break;
                }
                case "get_peers": {
                    valid_format = mess.zMessage.safeParse(msg).success;
                    break;
                }
                case "getobject": {
                    valid_format = mess.zObjectIdMessage.safeParse(msg).success;
                    break;
                }
                case "ihaveobject": {
                    valid_format = mess.zObjectIdMessage.safeParse(msg).success;
                    break;
                }
                case "getobject": {
                    valid_format = mess.zObjectIdMessage.safeParse(msg).success;
                    break;
                }
                case "getmempool": {
                    valid_format = mess.zMessage.safeParse(msg).success;
                    break;
                }
                case "mempool": {
                    valid_format = mess.zMempoolMessage.safeParse(msg).success;
                    break;
                }
                case "getchaintip": {
                    valid_format = mess.zMessage.safeParse(msg).success;
                    break;
                }
                case "chaintip": {
                    valid_format = mess.zChainTipMessage.safeParse(msg).success;
                    break;
                }
            }
        }
        // Defaulting to True here
        if(valid_format) {
            destroy_soc(socket, "INVALID_HANDSHAKE", `Can't send ${msg.type}: not received hello`);
        } else {
            destroy_soc(socket, "INVALID_FORMAT", `Message formatted incorrectly`);
        }
        return false;
    };
    
    /*
    Processes all messages received after the hello message, checks correct
    formatting and processes the message accordingly
    */
    process_msg(socket : net.Socket, msg: any, server: boolean) : boolean {
        let valid_format = false
        if ("type" in msg) {
            switch(msg.type) { 
                case "hello": {
                    let parsed_msg = mess.zHelloMessage.safeParse(msg)
                    if(parsed_msg.success) {
                        if(this.process_hello(parsed_msg.data)) {
                            destroy_soc(socket, "INVALID_FORMAT", "Hello already sent");
                            return false;
                        }
                    }
                    break;
                } 
                case "peers": { 
                    let parsed_msg = mess.zPeersMessage.safeParse(msg);
                    if(parsed_msg.success) {
                        console.log(`Processing ${server ? "Server" : "Client"} peers Message`);
                        return this.process_peers(parsed_msg.data);
                    }
                    break; 
                } 
                case "getpeers": { 
                    console.log(`Processing ${server ? "Server" : "Client"} getpeers Message`);
                    let parsed_msg = mess.zMessage.safeParse(msg);
                    if(parsed_msg.success) {
                        return this.process_getpeers(socket);
                    }
                    break;
                } 
                default: { 
                //statements; 
                    break; 
                } 
            }
    }

        if(!valid_format) {
            destroy_soc(socket, "INVALID_FORMAT", `Message formatted incorrectly`);
        }
        // Will want to do some checking in the future on return valid of 
        return true;
    }
}