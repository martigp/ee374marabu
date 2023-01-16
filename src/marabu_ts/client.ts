import net from 'net';
import {valid_format, send_hello, process_msg, send_get_peers} from './tcp';
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
    this.socket.connect(HARDCODE_PORT, HARDCODE_HOST,() => {
        console.log("Connected to foreign Server");
        send_hello(this.socket, false);
        send_get_peers(this.socket);
    });
    this.socket.on('data', (data) => {
        // Do data handling?
    });
 }
}