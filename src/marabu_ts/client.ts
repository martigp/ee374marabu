import net from 'net';
import fs from 'fs';
import { send_hello, send_get_peers, valid_format, process_msg} from './tcp';
import {ERRORS, destroy_soc, DEFAULT_TIMEOUT} from './error';
import { IMessage } from './messages/message';
import { canonicalize } from "json-canonicalize";
import { send } from 'process';

const HARDCODE_PORT = 18018;
const HARDCODE_HOST = "45.63.84.226";

export class MarabuClient {
    private socket : net.Socket;
    private buffer : string;
    private hello_rcvd : boolean;
 
    constructor() {
        this.socket = new net.Socket();
        this.buffer = '';
        this.hello_rcvd = false;
    }

    connect() {
    // Read from peers file, but hardcoded here
        // var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 

        // var existingpeers = jsondata.peers;

        this.socket.connect(HARDCODE_PORT, HARDCODE_HOST,() => {
            console.log("Connected to foreign Server");
            send_hello(this.socket, false);
            send_get_peers(this.socket);
        });

        this.socket.on('data', (data) => {
            this.buffer += data;
            const messages = this.buffer.split('\n');
            // Empty string if last character is '\n'
            if (messages.length > 1) {
                // Catch any exceptions from JSON parsing
                try {
                    let first_msg : IMessage = JSON.parse(messages[0]);
                    if(valid_format(first_msg)) {
                        if(!this.hello_rcvd) {
                            if(first_msg.type === "hello") {
                                this.hello_rcvd = true;
                                console.log("Client Hello Received");
                            } else {
                                destroy_soc(this.socket, ERRORS.INVALID_HANDSHAKE, "Not received hello yet");
                                this.buffer = '';
                            }
                        } else {
                            process_msg(this.socket, first_msg);
                        }
                        for(const message of messages.slice(Number(this.hello_rcvd), -1)) {
                            // Process each message accordingly
                            let json_msg = JSON.parse(message);
                            if(valid_format(json_msg)) {
                                process_msg(this.socket, json_msg);
                            } else {
                                // Could be more specific by putting this in the valid format function
                                destroy_soc(this.socket, ERRORS.INVALID_FORMAT, "Invalid Marabu Message Formatting");
                                this.buffer = '';
                            }
                        }
                    }
                }
                catch(e) {
                    console.log(e);
                    destroy_soc(this.socket, ERRORS.INVALID_FORMAT, "Message was invalid JSON format");
                    this.buffer = '';
                }
            }
            this.buffer = messages[messages.length - 1];
        });
        this.socket.on('data', (data) => {
            //do data handling of peers for example!
            console.log(`Server sent: ${data}`);
        })
        this.socket.on('error', (error) =>{
            console.error(`Server error: ${error}`)
        });
        this.socket.on('close', () =>{
            console.error(`Server disconnected`);
        });
    }
}