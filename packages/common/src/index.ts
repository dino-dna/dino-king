export * from './errors'
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

export type PlayerState = {
  characterType: CharacterType
  gameId: number
  isAlive: boolean
  lastUpdateTime?: number
  playerBodyState: PlayerBodyState
  teamId: TeamColor
  teamPlayerId: number
  uuid: number
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
  HANDLE_NEW_PLAYER = 'HANDLE_NEW_PLAYER',
  HANDLE_PLAYER_DISCONNECTED = 'HANDLE_PLAYER_DISCONNECTED',
  KILL_PLAYER = 'KILL_PLAYER',
  PLAYER_REGISTRATIONS = 'PLAYER_REGISTRATIONS',
  SERVER_PLAYERS = 'SERVER_PLAYERS',
  TEARDOWN = 'TEARDOWN',
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE'
}

export const DEATH_ANIMATION_DURATION = 3000
