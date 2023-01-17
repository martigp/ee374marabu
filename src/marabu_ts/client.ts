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
    // Read from peers file
    var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 

    var existingpeers = jsondata.peers; 

    this.socket.connect(HARDCODE_PORT, HARDCODE_HOST,() => {
        console.log("Connected to foreign Server");
        send_hello(this.socket, false);
        send_get_peers(this.socket);
    });

    client.on('data', (data) => {
        //do data handling 
        console.log(`Server sent: ${data}`);
    })
    client.on('error', (error) =>{
        console.error(`Server error: ${error}`)
    });
    client.on('close', () =>{
        console.error(`Server disconnected`);
    });
 }
}