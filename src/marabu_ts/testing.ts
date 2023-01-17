import fs from 'fs'

export function process_peers(msg: any) {
    //add the peers to our local json peers.json 
    let newPeers: string[] = msg.peers; 

    var jsondata = JSON.parse(fs.readFileSync('src/peers.json', 'utf-8')); 

    var existingpeers = jsondata.peers; 

    var finalPeers: string[] = newPeers.concat(existingpeers); 
    finalPeers = [...new Set([...newPeers,...existingpeers])]; //remove duplicates
    
    const peersString = { 
        peers: finalPeers,
    }
    fs.writeFile("src/peers.json", JSON.stringify(peersString), err => {
        if (err) console.log("Error Updating Peers: ", err);
      });

}

process_peers({"peers": ["45.63.84.226:18011", "45.63.84.226:18018"]})

