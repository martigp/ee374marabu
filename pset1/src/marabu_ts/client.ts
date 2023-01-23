import net from 'net';
import { send_hello, send_get_peers, tcp_responder} from './tcp';
import {DEFAULT_TIMEOUT} from './error';

const HARDCODE_PORT = 18018;
const HARDCODE_HOST = "45.77.189.40";

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
        this.socket.connect(HARDCODE_PORT, HARDCODE_HOST,() => {
            this.socket.setTimeout(DEFAULT_TIMEOUT);
            console.log("Connected to foreign Server");
            send_hello(this.socket, false);
            send_get_peers(this.socket);
        });

        tcp_responder(this.socket, this.buffer, this.hello_rcvd, false);
    }
}