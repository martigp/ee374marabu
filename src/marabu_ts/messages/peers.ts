import { IPeersMessage } from './message';
import * as peersJson from '../peers.json'; 

export class PeersMessage implements IPeersMessage {
    type: string = "peers";
    peers: string[] = peersJson.peers;
 }

 export function isPeersMessage(msg: object) : msg is IPeersMessage {
    return true; //TODO: figure out how to validate 
 }

