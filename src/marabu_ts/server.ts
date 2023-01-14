import net from 'net';
import {valid_format, send_hello, process_msg} from './tcp';
import {ERRORS, destroy_soc, DEFAULT_TIMEOUT} from './error';
import { canonicalize } from "json-canonicalize";
import { send } from 'process';

// This means anyone can connect on internet
export const SERVER_HOST = '0.0.0.0';
// just like marabu
export const SERVER_PORT = 18018;

export function listener(socket : net.Socket) {
    const address = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Client connected: ${address}`);
    socket.setTimeout(DEFAULT_TIMEOUT);
    send_hello(socket, true);

    let buffer = '';
    let hello_rcvd = false;

    socket.on('data', (data) => {
        buffer += data;
        const messages = buffer.split('\n');
        // Empty string if last character is '\n'
        if (messages.length > 1) {
            // Catch any exceptions from JSON parsing
            try {
                let first_msg = JSON.parse(messages[0]);
                if(valid_format(first_msg)) {
                    if(!hello_rcvd) {
                        if(first_msg.type === "hello") {
                            hello_rcvd = true;
                        } else {
                            destroy_soc(socket, ERRORS.INVALID_HANDSHAKE, "Not received hello yet");
                        }
                    } else {
                        process_msg(socket, first_msg);
                    }
                    for(const message of messages.slice(Number(hello_rcvd), -1)) {
                        // Process each message accordingly
                        let json_msg = JSON.parse(message);
                        if(valid_format(json_msg)) {
                            process_msg(socket, json_msg);
                        } else {
                            // Could be more specific by putting this in the valid format function
                            destroy_soc(socket, ERRORS.INVALID_FORMAT, "Invalid Marabu Message Formatting");
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

    socket.on("timeout", () => {
        console.log("Server timed out");
        socket.destroy();
    });

    socket.on('error', (error) => {
        console.error(`Client Error: ${error}`);
    });

    socket.on('close', () => {
        console.log(`Client disconnected`);
    });
}