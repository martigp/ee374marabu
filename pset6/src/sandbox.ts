import { BlockObject, BlockObjectType, TransactionObject, TransactionObjectType } from './message'
import { canonicalize } from 'json-canonicalize'
import { ChildProcess, spawn } from 'child_process'

const blockTemplate : BlockObjectType =  
{
    T: '00000000abc00000000000000000000000000000000000000000000000000000',
    created: 0,
    miner: 'Gordon&Mapau',
    nonce: "15551b5116783ace79cf19d95cca707a94f48e4cc69f3db32f41081dab3e6641",
    note: 'Gordon&mapaupset6block',
    previd: '0000000052a0e645eca917ae1c196e0d0a4fb756747f29ef52594d68484bb5e2',
    txids: [],
    type: 'block',
    studentids: ["martigp", "mapau"]
}

let wholeblock = canonicalize(blockTemplate); 
let arr = wholeblock.split(blockTemplate.nonce)

let wholeBlockArr = canonicalize(blockTemplate).split(blockTemplate.nonce)

//let miner = spawn('ts-node', ['./src/worker', wholeBlockArr[0], canonicalize(blockTemplate.nonce), wholeBlockArr[1]])
let miner = spawn('./worker',[wholeBlockArr[0], blockTemplate.nonce, wholeBlockArr[1]])

miner.on('error', (err)=>{
    console.log("Failed to spawn child" + err)
})

miner.stdio[1]?.on('data', async (data)=>{
    console.log("Received:" + data)
})