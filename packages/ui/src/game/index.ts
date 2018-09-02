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

export const config: GameConfig = {
  backgroundColor: '#98d687',
  input: { keyboard: true },
  parent: 'game',
  physics: {
    default: 'matter',
    matter: {
      debug: true,
      enableSleep: true,
      gravity: { y: 300 }
    }
  },
  scene: gameScene.GameScene,
  title: 'Murder King',
  type: Phaser.AUTO,
  version: '1.0',
  width: gameScene.TARGET_WIDTH,
  height: gameScene.TARGET_HEIGTH,
  zoom: 1
}

export class MurderKing extends Game {
  constructor (config: GameConfig) {
    super(config)
  }
}
