import { z } from "zod";
import { IApplicationObject, zBlockObject, zTxObject } from "../application_objects/object"

//-----------------------Message--------

export interface IMessage {
    type : string;
}

export const zMessage = z.object({
    // Might be the string version of type
    type: z.string(),
});
//-----------------------Hello Message--------
export interface IHelloMessage extends IMessage {
    version : string;
    agent? : string;
}

export const zHelloMessage = zMessage.extend({
    version: z.string(),
    agent: z.optional(z.string()),
});

//-----------------------Peers Messages--------

export interface IGetPeersMessage extends IMessage {
}

export interface IPeersMessage extends IMessage {
    peers : Array<string>;
}

export const zPeersMessage = zMessage.extend({
    peers: z.array(z.string()),
})


//-----------------------Object Messages--------

/*
For both HaveObject and GetObject 
*/
export interface IObjectIdMessage extends IMessage {
    objectid : string;
}

export const zObjectIdMessage = zMessage.extend({
    objectid: z.string(),
})


export interface IObjectMessage extends IMessage {
    obj : IApplicationObject;
}

export const zObjectMessage = zMessage.extend({
    object: zBlockObject.or(zTxObject),
});

//-----------------------Mempool Messages--------

export interface IGetMempoolMessage extends IMessage {}

export interface IMempoolMessage extends IMessage {
    txids : Array<string>;
}

export const zMempoolMessage = zMessage.extend({
    txids: z.array(z.string()),
});

//-----------------------Chain Tip Messages--------

export interface IGetChainTipMessage extends IMessage {}

export interface IChainTipMessage extends IMessage {
    blockid : string;
}

export const zChainTipMessage = zMessage.extend({
    blockid: z.string(),
});