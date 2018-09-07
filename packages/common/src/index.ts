export type TeamColor = 'blue' | 'orange'

export type CentralGameState = {
  playerStateByUuid: PlayerStateByUuid
}

export type CharacterType = 'king' | 'knight' | 'peon'

export type PlayerBodyState = {
  acceleration: Phaser.Math.Vector2
  position: Phaser.Math.Vector2
  velocity: Phaser.Math.Vector2
  currentAnimationName: string
}

export type PlayerStateByUuid = {
  [uuid: number]: PlayerState
}

export type PlayerState = {
  playerBodyState: PlayerBodyState
  isAlive: boolean
}
export type PlayerRegistration = {
  uuid: number
  uid: number
  tid: TeamColor
  gid: number
  characterType: CharacterType
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
  PLAYER_REGISTRATIONS = 'PLAYER_REGISTRATIONS',
  HANDLE_NEW_PLAYER = 'HANDLE_NEW_PLAYER',
  HANDLE_PLAYER_DISCONNECTED = 'HANDLE_PLAYER_DISCONNECTED',
  UPDATE_GAME_STATE = 'UPDATE_GAME_STATE',
  UPDATE_PLAYER_STATE = 'UPDATE_PLAYER_STATE'
}
