import net from 'net';
import {SERVER_HOST, SERVER_PORT, listener, MarabuServer} from './marabu_ts/server';
import { MarabuClient } from './marabu_ts/client';
import { send_get_peers, send_hello } from './marabu_ts/tcp';

class MarabuNode {
    client : MarabuClient = new MarabuClient();
    server : MarabuServer = new MarabuServer();
    peers_file : string;

    constructor(peers_file : string) {
        this.client = new MarabuClient();
        this.server = new MarabuServer();
        this.peers_file = peers_file;
    }
}


const node = new MarabuNode("./peers.json");
node.server.listen(SERVER_PORT, SERVER_HOST);