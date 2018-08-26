import { Character } from '../Character'

export const TARGET_WIDTH = 1920
export const TARGET_HEIGTH = 1020

export class GameScene extends Phaser.Scene {
  // // objects
  // private bird: Bird;
  // private pipes: Phaser.GameObjects.Group;
  private bg: Phaser.Tilemaps.StaticTilemapLayer
  private platforms: Phaser.Tilemaps.StaticTilemapLayer

  public player: Character

  constructor () {
    super({
      key: 'GameScene'
    })
  }

  preload () {
    this.load
      .pack('preload', './pack.json', 'preload')
      .tilemapTiledJSON('map', 'assets/murder-king.json')
      .image('bg', 'assets/images/bg.png')
  }

  postCreate () {
    const ws = new WebSocket('ws://localhost:9999')
    ws.addEventListener('open', function open () {
      ws.send(
        JSON.stringify({
          type: 'REQUEST_CHARACTER',
          payload: {
            team: { auto: true }
          }
        })
      )
    })

    ws.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (message.type === 'ASSIGN_CHARACTER') {
        this.createPlayer(message.payload)
      } else {
        throw new Error(`unsupported message: ${message}`)
      }
    })
  }

  createPlayer (config: CharacterConfig) {
    if (this.player) {
      return console.log('player already exists, skipping')
    }
    console.log(config)
    this.player = new Character({
      scene: this,
      x: 100,
      y: 450,
      texture: `dude_${config.team}/1`
    })
    this.player.body.setCollideWorldBounds(true)
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05)
    this.physics.add.collider(this.player, this.platforms)
  }

  create () {
    this.cameras.main.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    this.physics.world.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('bg', 'bg')
    this.bg = map.createStaticLayer('bg', tileset, 0, 0)
    this.platforms = map.createStaticLayer('platforms', tileset, 0, 0)
    this.platforms.setCollisionByProperty({ collides: true })
    this.postCreate()
  }

  update () {
    if (this.player) this.player.update()
  }
}
