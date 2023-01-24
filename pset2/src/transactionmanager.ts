import { db } from './store'
import { logger } from './logger'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'


class TransactionManager {
  
  verifyTransaction(){ 
    //ensure that a valid transaction with the given txid exists in your object database and that the given index is less than the number of outputs in the outpoint transaction.

    //verify the signature 
    return true;
  }

}
export const transactionManager = new TransactionManager()