import { CharacterType } from 'common'

export enum GameMessages {
  SocketError = 'SocketError',
  GameShutdown = 'GameShutdown'
}

export interface RunningGameState {
  error: false
  type: 'Running'
}

export interface StartedGameState {
  error: false
  type: 'Starting'
}

export interface StoppedGameState {
  error: false
  type: 'Stopped'
}

export interface SocketErrorState {
  error: true
  type: 'SocketError'
}

export type ErrorGameState = SocketErrorState
export type OkGameState = RunningGameState | StartedGameState | StoppedGameState
export type GameState = ErrorGameState | OkGameState

export type CharacterInitOptions = {
  // Phaser Sprint args, in object form
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  frame?: string | integer
  characterType: CharacterType
}
