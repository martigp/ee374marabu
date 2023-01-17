import { IGetPeersMessage } from './message';

export class GetPeersMessage implements IGetPeersMessage {
    type: string = "getpeers";
 }

 export function isGetPeersMessage(msg: object) : msg is IGetPeersMessage {
    return true; //TODO: figure out if/how to validate 
 }

