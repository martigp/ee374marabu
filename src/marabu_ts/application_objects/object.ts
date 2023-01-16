import {IInput} from './input';
import {IOutput} from './output';

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

export interface ITxObject extends IApplicationObject {
    inputs : Array<IInput>
    outputs : Array<IOutput>
}