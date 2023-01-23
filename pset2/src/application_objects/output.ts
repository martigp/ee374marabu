import { z } from "zod";

export interface IOutput {
    pubkey: string;
    value: Number;
}

export const zOutput = z.object({
    pubkey: z.string(),
    value : z.number(),
});