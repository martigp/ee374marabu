
export class ApplicationObject {
    type : string;

    constructor(type: string) {
        this.type = type;
}
}


export interface IOutpoint {
    txid : string;
    index: Number;
}

export interface IInput {
    outpoint : IOutpoint;
    sig : string;
}

export interface IBlockObject extends ApplicationObject {
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


export interface ITxObject extends ApplicationObject {
    inputs : Array<IInput>
    outputs : Array<IOutput>
}
