

export interface IOutpoint {
    txid : string;
    index: Number;
}

export interface IInput {
    outpoint : IOutpoint;
    sig : string;
}

export interface IApplicationObject {
    type : string;
}

export interface IBlockObject extends IApplicationObject {
    txids : Array<string>;
    nonce : string;
    previd: string;
    created : Number;
    target : string;
    miner: string;
    note: string; 
}


export interface IOutput {
    pubkey: string;
    value: Number;
}


export interface ITxObject extends IApplicationObject {
    inputs : Array<IInput>
    outputs : Array<IOutput>
}
