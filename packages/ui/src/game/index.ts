import { Game } from 'phaser'
import * as gameScene from './scenes/GameScene'

// var walls
// var platforms
// var ballHolders: Array<BallHolder> = []
// var balls: Array<Ball> = []
// var snail: Snail
// var gates: Array<Gate> = []
// let bears: Array<Bear> = []
// let queens: Array<Queen> = []

export const config: Phaser.Types.Core.GameConfig = {
  backgroundColor: '#98d687',
  input: { keyboard: true },
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: true
    }
  },
  scene: gameScene.GameScene,
  title: 'Murder King',
  type: Phaser.AUTO,
  version: '1.0',
  width: 1280,
  height: 720,
  zoom: 1
}

export class MurderKing extends Game {
  constructor (config: Phaser.Types.Core.GameConfig) {
    super(config)
  }
}
