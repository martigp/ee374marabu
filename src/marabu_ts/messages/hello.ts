import { IHelloMessage } from './message';

export class HelloMessage implements IHelloMessage {
    type: string = "hello";
    version: string;
    agent?: string;
    constructor(hello: IHelloMessage) {
        this.version = hello.version;
        this.agent = hello.agent;
    }
    valid_version() : boolean {
        return /0\.9\..+/.test(this.version);
    }
 }

 export function isHelloMessage(msg: object) : msg is IHelloMessage {
    return "version" in msg;
 }

