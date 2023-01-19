import net from 'net';
import {SERVER_HOST, SERVER_PORT, MarabuServer} from './marabu_ts/server';
import { MarabuClient } from './marabu_ts/client';

class MarabuNode {
    initial_client : MarabuClient = new MarabuClient();
    server : MarabuServer = new MarabuServer();
    peers_file : string;

    constructor(peers_file : string) {
        this.initial_client = new MarabuClient();
        this.server = new MarabuServer();
        this.peers_file = peers_file;
    }
}


const node = new MarabuNode("./peers.json");
node.server.listen(SERVER_PORT, SERVER_HOST);
node.initial_client.connect();