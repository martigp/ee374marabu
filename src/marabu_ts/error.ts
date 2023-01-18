import net from 'net';
import './error';
import { canonicalize } from "json-canonicalize";

/*
This file deals with some of the errors and error handling for
our node
*/

export enum ERRORS {
    INTERNAL_ERROR,
    INVALID_FORMAT,
    UNKNOWN_OBJECT,
    UNFINDABLE_OBJECT,
    INVALID_HANDSHAKE,
    INVALID_TX_OUTPOINT,
    INVALID_TX_SIGNATURE,
    INVALID_TX_CONSERVATION,
    INVALID_BLOCK_COINBASE,
    INVALID_BLOCK_TIMESTAMP,
    INVALID_BLOCK_POW,
    INVALID_GENESIS,
}

export const DEFAULT_ERROR = { "type": "error", "name": "INVALID_FORMAT", "message": ""};

export function destroy_soc(socket: net.Socket, err_type: string, err_msg: string) {
    let err = DEFAULT_ERROR;
    err.name = err_type;
    err.message = err_msg;
    socket.write(canonicalize(err) + `\n`);
    socket.destroy();
}

// Default Timeout 10 seconds
export const DEFAULT_TIMEOUT = 10 * 1000