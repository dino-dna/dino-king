export type TeamColor = 'blue' | 'orange'

export type CentralGameState = {
  playerStateById: PlayerStateById
}

export type PlayerStateById = {
  [id: number]: PlayerState
}

export type PlayerState = {
  position: Phaser.Math.Vector2
  isAlive: boolean
}
export type PlayerRegistration = {
  id: number
  characterConfig: CharacterConfig
}
export type CharacterConfig = {
  team: TeamColor
  type: 'king' | 'knight' | 'peon'
}

export enum KingClientMessage {
  NEW_GAME,
  REQUEST_CHARACTER,
  REQUEST_PLAYERS,
  PLAYER_POSITION
}

export enum KingServerMessage {
  ASSIGN_CHARACTER,
  PLAYER_REGISTRATIONS,
  HANDLE_NEW_PLAYER,
  HANDLE_PLAYER_DISCONNECTED,
  UPDATE_GAME_STATE,
  UPDATE_PLAYER_STATE
}
