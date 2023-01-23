import { db } from './store'
import { logger } from './logger'
import isValidHostname from 'is-valid-hostname'
import { canonicalize } from 'json-canonicalize'
import { peerManager } from './peermanager'
import { Peer } from './peer'
import { MessageSocket } from './network'


class TransactionManager {
  
  //verifyTransaction()

}
export const transactionManager = new TransactionManager()