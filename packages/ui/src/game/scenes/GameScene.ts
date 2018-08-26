import { Character } from '../Character'

export const TARGET_WIDTH = 1920 
export const TARGET_HEIGTH = 1020

export class GameScene extends Phaser.Scene {
  // // objects
  // private bird: Bird;
  // private pipes: Phaser.GameObjects.Group;
  private bg: Phaser.GameObjects.TileSprite;
  public player: Character

  constructor() {
    super({
      key: "GameScene"
    })
  }
  preload () {
    this.load
      .pack("preload", "./pack.json", "preload")
      .tilemapTiledJSON('map', 'assets/murder-king.json')
      .image('bg', 'assets/images/bg.png')
  }
  create() {
    this.cameras.main.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    this.physics.world.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    // this.bg = this.add.tileSprite(0, 0, TARGET_WIDTH, TARGET_HEIGTH, 'bg').setOrigin(0, 0)
    // this.bg.setScale(1)
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('bg', 'bg')
    const bg = map.createStaticLayer("bg", tileset, 0, 0)
    const platformLayer = map.createStaticLayer("platforms", tileset, 0, 0)
    platformLayer.setCollisionByProperty({ collides: true })
    const debugGraphics = this.add.graphics().setAlpha(0.75);
    var platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'dude_blue/1').setScale(2).refreshBody();
    platforms.create(600, 400, 'dude_blue/1');
    platforms.create(50, 250, 'dude_blue/1', undefined, false);
    platforms.create(750, 220, 'dude_blue/1');
    platforms.create(0, 1040, 'dude_blue/1').setOrigin(0,0)
    this.player = new Character({
      scene: this,
      x: 100,
      y: 450,
      texture: 'dude_orange/1'
    })
    this.player.body.setCollideWorldBounds(true)
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.physics.add.collider(this.player, platforms)
    this.physics.add.collider(this.player, platformLayer)
  }
  update () {
    this.player.update()
  }
}
