import { logger } from './logger'
import { network } from './network'
import { chainManager } from './chain'
import { mempool } from './mempool'
import { miningManager } from './minimal_mining_pool'

const BIND_PORT = 18018
const BIND_IP = '0.0.0.0'

logger.info(`Malibu - A Marabu node`)
logger.info(`Gordon & Mapau`)

async function main() {
  await chainManager.init()
  await mempool.init()
  await miningManager.init()
  network.init(BIND_PORT, BIND_IP)
}

main()
