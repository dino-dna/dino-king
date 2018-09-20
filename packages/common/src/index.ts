export type TeamColor = 'blue' | 'orange'

export type CentralGameState = {
  playerStateByUuid: PlayerStateByUuid
  playerStateChangeCounter: number
  serverTime: number
}

export type CharacterType = 'king' | 'knight' | 'peon'

export type PlayerBodyState = {
  acceleration: { x: number; y: number }
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  currentAnimationName: string
}

export type PlayerStateByUuid = {
  [uuid: number]: PlayerState
}

export type ServerPlayer = {
  state: PlayerState
  registration: PlayerRegistration
}

export type PlayerState = {
  characterType: CharacterType
  playerBodyState: PlayerBodyState
  isAlive: boolean
  lastUpdateTime?: number
}
export type PlayerRegistration = {
  uuid: number
  uid: number
  tid: TeamColor
  gid: number
}

export enum KingClientMessage {
  KILL_PLAYER = 'KILL_PLAYER',
  NEW_GAME = 'NEW_GAME',
  REQUEST_CHARACTER = 'REQUEST_CHARACTER',
  REQUEST_PLAYERS = 'REQUEST_PLAYERS',
  PLAYER_BODY_STATE = 'PLAYER_BODY_STATE'
}

export enum KingServerMessage {
  ASSIGN_CHARACTER = 'ASSIGN_CHARACTER',
  KILL_PLAYER = 'KILL_PLAYER',
  SERVER_PLAYERS = 'SERVER_PLAYERS',
  HANDLE_NEW_PLAYER = 'HANDLE_NEW_PLAYER',
  HANDLE_PLAYER_DISCONNECTED = 'HANDLE_PLAYER_DISCONNECTED',
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE',
  TEARDOWN = 'TEARDOWN'
}
