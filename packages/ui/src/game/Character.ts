import { CharacterType } from 'common'

type ICharacter = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  frame?: string | integer
  characterType: CharacterType
}

const DEFAULT_ACCEL_Y = 500

export class Character extends Phaser.GameObjects.Sprite {
  private jumpKey: Phaser.Input.Keyboard.Key
  public body: Phaser.Physics.Arcade.Body
  public cursors: CursorKeys
  public characterType: CharacterType
  // private anim: Phaser.Tweens.Tween[];

  constructor (params: ICharacter) {
    super(params.scene, params.x, params.y, params.texture, params.frame)
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    // params.scene.physics.world.enable(this)
    this.body.gravity.y = DEFAULT_ACCEL_Y
    this.body.setAllowDrag(true)
    this.body.setDrag(100, 0)
    this.body.setFriction(0.7, 0)
    this.characterType = params.characterType

    // this.player = this.physics.add.sprite(100, 450, 'dude_orange/1');
    // player.setBounce(0.2);
    // player.setCollideWorldBounds(true);
    // image
    // this.setScale(3);
    // this.setOrigin(0, 0);

    // this.body.setGravityY(1000);
    // this.body.setSize(17, 12);

    // animations & tweens
    // this.anim = [];
    // this.anim.push(
    //   params.scene.tweens.add({
    //     targets: this,
    //     duration: 100,
    //     angle: -20
    //   })
    // );

    // input
    this.jumpKey = params.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )
    params.scene.add.existing(this)
  }

  update (): void {
    this.handleInput()
  }

  private handleInput (): void {
    if (!this.body) {
      console.warn('character body not yet created?')
      return
    }
    const { cursors } = this
    if (cursors.left!.isDown) this.body.setVelocityX(-160)
    else if (cursors.right!.isDown) this.body.setVelocityX(160)
    if (cursors.down!.isDown && this.characterType === 'king') {
      this.body.acceleration.y < 300 && this.body.setAccelerationY(600)
      this.body.velocity.y < 400 && this.body.setVelocityY(400)
    } else {
      this.body.setAccelerationY(DEFAULT_ACCEL_Y)
    }
    if (this.body.onFloor()) {
      this.body.setAccelerationX(0)
      this.body.setDragX(200)
    } else {
      this.body.setDragX(0)
    }
    const isFlapping =
      this.jumpKey.isDown &&
      this.jumpKey.repeats < 2 &&
      this.body.velocity.y >= -100
    if (isFlapping) this.flap()
  }

  public flap (): void {
    this.body.setVelocityY(-200)
  }
}
