import { z } from "zod";

export interface IOutpoint {
    txid : string;
    index: Number;
}

const ZOutpoint = z.object({
    txid: z.string(),
    index: z.number(),
});

export interface IInput {
    outpoint : IOutpoint;
    sig : string;
}

export const zInput = z.object({
    outpoint : ZOutpoint,
    sig : z.string(),
});