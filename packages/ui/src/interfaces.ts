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
  scene: Phaser.Scene
  x: number
  y: number
  characterType: CharacterType
}

export interface CharacterSprite {
  textures: SpriteTexture[]
}

export interface SpriteTexture {
  image: string
  format: string
  size: {
    w: number
    h: number
  }
  scale: number
  frames: SpriteFrame[]
}

export interface SpriteFrame {
  filename: string
  rotated: boolean
  trimmed: boolean
  sourceSize: {
    w: number
    h: number
  }
  spriteSourceSize: {
    x: number
    y: number
    w: number
    h: number
  }
  frame: {
    x: number
    y: number
    w: number
    h: number
  }
}
