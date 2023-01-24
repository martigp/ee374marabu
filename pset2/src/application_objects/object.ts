import {IInput,} from './input';
import {IOutput,} from './output';
import { z } from 'zod';
import { type } from 'os';

export interface IApplicationObject {
    type : string;
}

export function createObject(obj: IApplicationObject){ 
    type: type; 
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
