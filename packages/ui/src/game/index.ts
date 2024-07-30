import Phaser, { Game } from "phaser";
import * as gameScene from "./scenes/GameScene";

// var walls
// var platforms
// var ballHolders: Array<BallHolder> = []
// var balls: Array<Ball> = []
// var snail: Snail
// var gates: Array<Gate> = []
// let bears: Array<Bear> = []
// let queens: Array<Queen> = []

export class DinoKing extends Game {
  // eslint-disable-next-line
  constructor({ gameId }: { gameId: number }) {
    const config: Phaser.Types.Core.GameConfig = {
      backgroundColor: "#98d687",
      input: { keyboard: true },
      parent: "game",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 300 },
          debug: true,
        },
      },
      scene: gameScene.GameScene,
      title: "Dino King",
      type: Phaser.AUTO,
      version: "1.0",
      width: 1280,
      height: 720,
      zoom: 1,
    };
    super(config);
  }
}
