import * as net from 'net'
import { logger } from './logger'
import { Peer } from './peer'
import { EventEmitter } from 'events'
import { peerManager } from './peermanager'
import { objectManager } from './objectmanager'
import { canonicalize } from 'json-canonicalize'

const TIMEOUT_DELAY = 10000 // 10 seconds
const MAX_BUFFER_SIZE = 100 * 1024 // 100 kB

export class Network {
  peers: Peer[] = []

  async init(bindPort: number, bindIP: string) {
    await peerManager.load()
    await objectManager.load()

    // Create server and when listening, and for each new connection send a
    // hello and getpeers message.
    const server = net.createServer((socket) => {
      logger.info(`New connection from peer ${socket.remoteAddress}`)
      const peer = new Peer(new MessageSocket(socket, `${socket.remoteAddress}:${socket.remotePort}`))
      this.peers.push(peer)
      peer.onConnect()
      peer.socket.on('gossip', (gossipMsg) => {
        logger.debug(`Gossip event received with msg ${canonicalize(gossipMsg)}`);
        for(const gossipPeer of this.peers) {
          logger.info(`Attempting to gossip to peer: ${gossipPeer.socket.peerAddr}`)
          gossipPeer.sendMessage(gossipMsg);
        }
      });
    })

    logger.info(`Listening for connections on port ${bindPort} and IP ${bindIP}`)
    server.listen(bindPort, bindIP)

    // Being a client to every single of the known peers as well
    for (const peerAddr of peerManager.knownPeers) {
      logger.info(`Attempting connection to known peer ${peerAddr}`)
      try {
        const peer = new Peer(MessageSocket.createClient(peerAddr))
        this.peers.push(peer)
        peer.socket.on('gossip', (gossipMsg) => {
          logger.debug(`Gossip event received with msg ${canonicalize(gossipMsg)}`);
          logger.debug(`List of peers sending to:\n${this.peers}`);
          for(const gossipPeer of this.peers) {
            logger.info(`Attempting to gossip to peer: ${gossipPeer.socket.peerAddr}`)
            gossipPeer.sendMessage(gossipMsg);
          }
        });
      }
      catch (e: any) {
        logger.warn(`Failed to create connection to peer ${peerAddr}: ${e.message}`)
      }
    }
  }
}

export class MessageSocket extends EventEmitter {
  buffer: string = '' // defragmentation buffer
  netSocket: net.Socket
  peerAddr: string
  timeout: NodeJS.Timeout | undefined

  static createClient(peerAddr: string) {
    const [host, portStr] = peerAddr.split(':')
    const port = +portStr
    if (port < 0 || port > 65535) {
      throw new Error('Invalid port')
    }
    const netSocket = new net.Socket()
    const socket = new MessageSocket(netSocket, peerAddr)

    netSocket.connect(port, host)

    return socket
  }
  constructor(netSocket: net.Socket, peerAddr: string) {
    super()

    this.peerAddr = peerAddr
    this.netSocket = netSocket
    this.netSocket.on('data', (data: string) => {
      if (this.buffer.length > MAX_BUFFER_SIZE) {
        this.emit('timeout')
        return;
      }

      this.buffer += data
      const messages = this.buffer.split('\n')

      if (messages.length > 1) {
        for (const message of messages.slice(0, -1)) {
          this.emit('message', message)
          if (this.timeout) clearTimeout(this.timeout)
        }
        this.buffer = messages[messages.length - 1]
      }

      if (!this.timeout && this.buffer.length > 0) {
        this.timeout = setTimeout(() => {
          this.emit('timeout')
        }, TIMEOUT_DELAY)
      }
    })
  }
  sendMessage(message: string) {
    this.netSocket.write(`${message}\n`)
  }
  end() {
    this.netSocket.end()
  }
}
