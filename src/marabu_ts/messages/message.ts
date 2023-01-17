import { z } from "zod";


export interface IMessage {
    type : string;
}

export const zMessage = z.object({
    // Might be the string version of type
    type: z.string(),
});

export interface IHelloMessage extends IMessage {
    version : string;
    agent? : string;
}

export const zHelloMessage = zMessage.extend({
    version: z.string(),
    agent: z.optional(z.string()),
});

export interface IGetPeersMessage extends IMessage {
}

export interface IPeersMessage extends IMessage {
    peers : Array<string>;
}

export interface IGetObjectMessage extends IMessage {
    objectid : string;
}

export interface IHaveObjectMessage extends IMessage {
    objectid : string;
}

export interface IObjectMessage extends IMessage {
    obj : object;
}

export interface IGetMempoolMessage extends IMessage {}

export interface IMempoolMessage extends IMessage {
    txids : Array<string>;
}

export interface IGetChainTipMessage extends IMessage {}

export interface IChainTipMessage extends IMessage {
    blockid : string;
}
