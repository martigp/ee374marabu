import { KeyObject } from 'crypto'
import { Literal, Record, String, Array, Union, Static, Void, Unknown,} from 'runtypes'
import { ApplicationObject} from "./application_objects/object"


export const HelloMessage = Record({
  type: Literal('hello'),
  version: String,
  agent: String
})
export type HelloMessageType = Static<typeof HelloMessage>

export const GetPeersMessage = Record({
  type: Literal('getpeers')
})
export type GetPeersMessageType = Static<typeof GetPeersMessage>

export const PeersMessage = Record({
  type: Literal('peers'),
  peers: Array(String)
})
export type PeersMessageType = Static<typeof PeersMessage>

export const GetObjectMessage = Record({
  type: Literal('getobject'),
  objectid: String
})
export type GetObjectMessageType = Static<typeof GetObjectMessage>

export const IHaveObjectMessage = Record({
  type: Literal('ihaveobject'),
  objectid: String
})
export type IHaveObjectMessageType = Static<typeof IHaveObjectMessage>

export const ObjectMessage = Record({
  type: Literal('object'),
  object: ApplicationObject 
})

export type ObjectMessageType = Static<typeof ObjectMessage>

const ErrorChoices = Union(
  Literal('INTERNAL_ERROR'),
  Literal('INVALID_FORMAT'),
  Literal('INVALID_HANDSHAKE'),
  Literal('INVALID_TX_OUTPOINT'),
  Literal('UNKNOWN_OBJECT'),
  Literal('INVALID_TX_SIGNATURE'),
  Literal('INVALID_TX_CONSERVATION')
)

export const ErrorMessage = Record({
  type: Literal('error'),
  name: ErrorChoices,
  description: String
})
export type ErrorMessageType = Static<typeof ErrorMessage>
export type ErrorChoice = Static<typeof ErrorChoices>

export class AnnotatedError extends Error {
  err = ""
  constructor(name: ErrorChoice, description: string) {
    super(description)
    this.name = name
    Object.setPrototypeOf(this, AnnotatedError.prototype)
  }

  getJSON() {
    const jsonError = {type: "error", name: this.name, description: this.message}
    if (ErrorMessage.guard(jsonError)) {
      return jsonError
    }else {
      return {type: "error", name: "INTERNAL_ERROR", description: "Something went wrong."}
    }
  }
}

export const Message = Union(HelloMessage, GetPeersMessage, PeersMessage, ErrorMessage, IHaveObjectMessage, GetObjectMessage, ObjectMessage)
export type MessageType = Static<typeof Message>

export const Messages = [HelloMessage, GetPeersMessage, PeersMessage, ErrorMessage, IHaveObjectMessage, GetObjectMessage, ObjectMessage]
