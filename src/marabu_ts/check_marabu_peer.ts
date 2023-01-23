import { isIP } from 'net';
const isValidDomain = require('is-valid-domain');

export function check_marabu_peer(peer : string) : boolean {
    let split_peer = peer.split(":");
    if (split_peer.length != 2) {
        return false;
    }
    let host = split_peer[0];
    let port = split_peer[1];

    //Host processing first
    if (isIP(host) | isValidDomain(host) ) {
         return /[0-65535]/.test(port);
    }
    return false;
}