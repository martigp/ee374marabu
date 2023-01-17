export interface IMessage {
    type : string;
}

export interface IHelloMessage extends IMessage {
    version : string;
    agent? : string;
}

export interface IGetPeersMessage extends IMessage {
    type: string;
}

export interface IPeersMessage extends IMessage {
    type: string; 
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
