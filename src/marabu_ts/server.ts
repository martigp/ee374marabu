import net from 'net';
import { send_hello, send_get_peers, tcp_responder} from './tcp';
import { destroy_soc, DEFAULT_TIMEOUT } from './error';
import { IMessage } from './messages/message';

// This means anyone can connect on internet
export const SERVER_HOST = '0.0.0.0';
// just like marabu
export const SERVER_PORT = 18018;

export class MarabuServer {
    private server : net.Server;

    constructor() {
        this.server = net.createServer(this.listener);
    }

    listen(port : number, host : string) {
        this.server.listen(port, host, () => {
            console.log(`Listening on ${port}:${host}`);
        });
    }

    listener(socket : net.Socket) {
        const address = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`Client connected: ${address}`);
        
        socket.setTimeout(DEFAULT_TIMEOUT, ()=> {
            socket.destroy();
        });
        send_hello(socket, true);
        send_get_peers(socket);

        let buffer = '';
        let hello_rcvd = false;

        tcp_responder(socket, buffer, hello_rcvd, true);
    }

}