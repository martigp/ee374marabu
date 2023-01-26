import net from 'net';
import { canonicalize } from "json-canonicalize";
import { logger } from './logger';
import { Unknown } from 'runtypes'; 


const SERVER_PORT = 18018;
const SERVER_HOST = '0.0.0.0'


// Making sure we get ihave objects
function test_case1() {
    const Grader1 = new net.Socket();
    const Grader2 = new net.Socket();

    Grader1.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader1 successfully connected to IP address 
                    ${Grader1.remoteAddress} on port ${Grader1.remotePort}`);
        let hello1: String = canonicalize({"agent":"Grader1","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello1}`);
        Grader1.write((`${hello1}\n`));
    });

    Grader2.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader2 successfully connected to IP address 
                    ${Grader2.remoteAddress} on port ${Grader2.remotePort}`);
        let hello2: String = canonicalize({"agent":"Grader2","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello2}`);
        Grader2.write((`${hello2}\n`));
    });

    let grader1Should : string[] = ["Hello", "IHAVE OBJ", "IHAVE OBJ"]

    // Hello messages
    let i = 0;
    Grader1.on('data', (data) => {
        console.log(`Grader 1 should have received ${grader1Should[i]}`)
        console.log(`Grader1 received message ${data}`);
        i++;
    });

    let grader2Should : string[] = ["Hello", "IHAVE OBJ", "OBJ", "IHAVE OBJ", "OBJ"]
    // Receiving data
    let j = 0;
    Grader2.on('data', (data) => {
        console.log(`Grader 2 should have received ${grader2Should[j]}`)
        console.log(`Grader2 received message ${data}`);
        j++;
    });


    let coinbase : String = canonicalize(
        { "object":
            { "height":0,
              "outputs":[
                    {"pubkey":"7578824af040dbeb6db5932d06c77443f57e8d3df2aeb04a9c899fa0f71da026",
                    "value":50000000000}
                ],
              "type":"transaction"
            },
         "type":"object"}
    ); 
    console.log(`Grader 1 sending message ${coinbase}`);
    Grader1.write(`${coinbase}\n`);

    // Grader2 sends getobject
    let getobjectmsg: String = canonicalize(
        { "objectid": "54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c",
          "type":"getobject"
        }
    );

    console.log(`Grader 2 sending message ${getobjectmsg}`)
    Grader2.write(`${getobjectmsg}\n`);

    let txmessage = canonicalize(
        {"object":
            {"inputs":
                [{"outpoint":
                    {"index":0,
                     "txid":"54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c"},
                     "sig":"85b871a84944c876f81a4a495c76b1980b63007db4d3d562600ee375db030e41e7d33789c803d6a6f545b84aeae729e337be751a9677c77bacd49f288ad96e04"}
                ],
             "outputs":
                [{"pubkey":"7578824af040dbeb6db5932d06c77443f57e8d3df2aeb04a9c899fa0f71da026",
                  "value":10}
                ],
            "type":"transaction"
            },
        "type":"object"}
    );
    Grader1.write(`${txmessage}\n`);
    let getobjectmsg2: String = canonicalize(
        { "objectid": "ea203aa2d8460c74251aa560d0f56e59470f186cfdc9d5b2fb824a8b2c3ede18",
          "type":"getobject"
        }
    );

    console.log(`Grader 2 sending message ${getobjectmsg2}`)
    Grader2.write(`${getobjectmsg2}\n`)
}

//Testcase: Must receive getobject message in response to ihaveobject message
function test_case2() {
    const Grader1 = new net.Socket();
    const Grader2 = new net.Socket();

    Grader2.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader2 successfully connected to IP address 
                    ${Grader2.remoteAddress} on port ${Grader2.remotePort}`);
        let hello2: String = canonicalize({"agent":"Grader2","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello2}`);
        Grader2.write((`${hello2}\n`));
    });

    Grader1.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader1 successfully connected to IP address 
                    ${Grader1.remoteAddress} on port ${Grader1.remotePort}`);
        let hello1: String = canonicalize({"agent":"Grader1","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello1}`);
        Grader1.write((`${hello1}\n`));
        let ihaveobject: String = canonicalize(
            { "objectid": "54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c",
              "type":"ihaveobject"
            }
        );
        console.log(`Grader1 sending ${ihaveobject}`);
        Grader1.write(`${ihaveobject}\n`);
    });

    let grader1Should : string[] = ["Hello", "GETPEERS", "GETOBJ", "IHAVE OBJ"]
    // Hello messages
    let i = 0;
    Grader1.on('data', (data : string) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
            console.log(`Grader 1 should have received ${grader1Should[i]}`)
            console.log(`Grader1 received message ${message}`);
            if (i == 1) {
                let coinbase : String = canonicalize(
                    { "object":
                        { "height":0,
                        "outputs":[
                                {"pubkey":"7578824af040dbeb6db5932d06c77443f57e8d3df2aeb04a9c899fa0f71da026",
                                "value":50000000000}
                            ],
                        "type":"transaction"
                        },
                    "type":"object"}
                );
                console.log(`Grader 1 writing coinbase ${coinbase}}`);
                Grader1.write(`${coinbase}\n`);
            }
            i++;
        }
    });

    let grader2Should : string[] = ["Hello", "IHAVE OBJ"]
    // Receiving data
    let j = 0;
    Grader2.on('data', (data) => {
        console.log(`Grader 2 should have received ${grader2Should[j]}`)
        console.log(`Grader2 received message ${data}`);
        j++;
    });

}

// Sent getobject in resopnse to ihaveobject that SERVER doesn't have
function test_case22() {
    const Grader1 = new net.Socket();
    const Grader2 = new net.Socket();

    Grader2.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader2 successfully connected to IP address 
                    ${Grader2.remoteAddress} on port ${Grader2.remotePort}`);
        let hello2: String = canonicalize({"agent":"Grader2","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello2}`);
        Grader2.write((`${hello2}\n`));
    });

    Grader1.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader1 successfully connected to IP address 
                    ${Grader1.remoteAddress} on port ${Grader1.remotePort}`);
        let hello1: String = canonicalize({"agent":"Grader1","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello1}`);
        Grader1.write((`${hello1}\n`));
        let ihaveobject: String = canonicalize(
            { "objectid": "54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c",
              "type":"ihaveobject"
            }
        );
        console.log(`Grader1 sending ${ihaveobject}`);
        Grader1.write(`${ihaveobject}\n`);
    });

    let grader1Should : string[] = ["Hello", "GETPEERS", "GETOBJECT"]
    // Hello messages
    let i = 0;
    Grader1.on('data', (data : string) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
            console.log(`Grader 1 should have received ${grader1Should[i]}`)
            console.log(`Grader1 received message ${message}`);
            i++;
        }
    });
}

// No crash when send an invalid getobject
function test_case4() {
    const Grader1 = new net.Socket();
    const Grader2 = new net.Socket();

    Grader2.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader2 successfully connected to IP address 
                    ${Grader2.remoteAddress} on port ${Grader2.remotePort}`);
        let hello2: String = canonicalize({"agent":"Grader2","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello2}`);
        Grader2.write((`${hello2}\n`));
    });

    Grader1.connect(SERVER_PORT, SERVER_HOST, async () => {

        console.log(`Grader1 successfully connected to IP address 
                    ${Grader1.remoteAddress} on port ${Grader1.remotePort}`);
        let hello1: String = canonicalize({"agent":"Grader1","type":"hello","version":"0.9.0"});
        console.log(`Sending message: ${hello1}`);
        Grader1.write((`${hello1}\n`));
        let getobject: String = canonicalize(
            { "objectid": "54d2d5264208f6541361f970c3f51a6b2c42745cf7110a5c7b771a6ad80e638c",
              "type":"getobject"
            }
        );
        console.log(`Grader1 sending ${getobject}`);
        Grader1.write(`${getobject}\n`);
        let getpeers = canonicalize(
            {type: "getpeers"}
        );
        console.log(`Grader1 sending ${getpeers}`);
        Grader1.write(`${getpeers}\n`);
    });

    let grader1Should : string[] = ["Hello", "GETPEERS", "PEERS"]
    // Hello messages
    let i = 0;
    Grader1.on('data', (data : string) => {
        let buffer : string = "";
        buffer += data;
        const messages = buffer.split('\n');
        for(const message of messages.slice(0,messages.length - 1)) {
            console.log(`Grader 1 should have received ${grader1Should[i]}`)
            console.log(`Grader1 received message ${message}`);
            i++;
        }
    });
}


function emulate_autograder() { 
    //test_case1();
    //test_case2();
    //test_case22();
    test_case4();
}

emulate_autograder(); 
