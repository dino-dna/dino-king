export type TeamColor = 'blue' | 'orange'

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
  PLAYER_POSITION
}

export enum KingServerMessage {
  ASSIGN_CHARACTER,
  HANDLE_NEW_PLAYER,
  HANDLE_PLAYER_DISCONNECTED,
  UPDATE_PLAYER_STATE
}
