import net from 'net';
import {SERVER_HOST, SERVER_PORT, listener} from './marabu_ts/server';
import { send_get_peers, send_hello } from './marabu_ts/tcp';
class MarabuNode {
    client_soc : net.Socket = new net.Socket();
    server : net.Server = net.createServer(listener);
}

const node = new MarabuNode();
node.server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Listening on ${SERVER_HOST}:${SERVER_PORT}`);
});
node.client_soc.connect(SERVER_PORT, SERVER_HOST, () => {
    send_hello(node.client_soc, false);
    send_get_peers(node.client_soc);
});