import {IInput, zInput} from './input';
import {IOutput, zOutput} from './output';
import { z } from 'zod';

export interface IApplicationObject {
    type : string;
}

export const zApplicationObject = z.object({
    type : z.string(),
});

export interface IBlockObject extends IApplicationObject {
    txids : Array<string>;
    nonce : string;
    previd: string;
    created : Number;
    target : string;
    miner: string;
    note: string; 
}

export const zBlockObject = zApplicationObject.extend({
    txids : z.array(z.string()),
    nonce : z.string(),
    previd: z.string(),
    created : z.number(),
    target : z.string(),
    miner: z.string(),
    note: z.string(),
});

export interface ITxObject extends IApplicationObject {
    inputs : Array<IInput>
    outputs : Array<IOutput>
}

export const zTxObject = zApplicationObject.extend({
    inputs : z.array(zInput),
    outputs : z.array(zOutput),
});