export interface IOutpoint {
    txid : string;
    index: Number;
}

export interface IInput {
    outpoint : IOutpoint;
    sig : string;
}