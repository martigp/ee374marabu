import net from 'net';
import {valid_format, send_hello} from './tcp';
import {ERRORS, destroy_soc} from './error';
import { canonicalize } from "json-canonicalize";
import { send } from 'process';

// This means anyone can connect on internet
export const SERVER_HOST = '0.0.0.0';
// just like marabu
export const SERVER_PORT = 18018;

export function listener(socket : net.Socket) {
    const address = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Client connected: ${address}`);
    let buffer = '';
    let hello_rcvd = false;
    socket.on('data', (data) => {
        buffer += data;
        const messages = buffer.split('\n');
        // Empty string if last character is '\n'
        if (messages.length > 1) {
            let start_ind = 0;
            try {
                let first_msg = JSON.parse(messages[0]);
                if(valid_format(first_msg)) {
                    if(!hello_rcvd) {
                        if(first_msg.type === "hello") {
                            start_ind = 1;
                            hello_rcvd = true;
                            // Send hello back
                            send_hello(socket, true);

                        } else {
                            destroy_soc(socket, ERRORS.INVALID_HANDSHAKE, "Not received hello yet");
                        }
                    }
                    for(const message of messages.slice(start_ind, -1)) {
                        // Process each message accordingly
                        if(valid_format(message)) {
                            // Do processing of each type.
                        } else {
                            // Could be more specific by putting this in the valid format function
                            destroy_soc(socket, ERRORS.INVALID_FORMAT, "Incorrect Message Formatting");
                        }
                    }
                }
            }
            catch(e) {
                destroy_soc(socket, ERRORS.INVALID_FORMAT, "Message was invalid JSON format");
            }
        }
        buffer = messages[messages.length - 1];
    });
    // Each of these happen are constantly running in the background
    socket.on('error', (error) => {
        console.error(`Client Error: ${error}`);
    });
    socket.on('close', () => {
        console.log(`Client disconnected`);
    });
}