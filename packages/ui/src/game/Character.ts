import { CharacterType } from 'common'

type ICharacter = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  frame?: string | integer
  characterType: CharacterType
}

const kingFrameMeta = {
  walk: {
    frames: 10
  },
  run: {
    frames: 8
  },
  dead: {
    frames: 8
  },
  idle: {
    frames: 10
  },
  jump: {
    frames: 12
  }
}

const DEFAULT_ACCEL_Y = 500

export class Character extends Phaser.GameObjects.Sprite {
  private jumpKey: Phaser.Input.Keyboard.Key
  public body: Phaser.Physics.Arcade.Body
  public cursors: CursorKeys
  public characterType: CharacterType
  public currentAnimationName: string
  public currentAnimationX: number
  // private anim: Phaser.Tweens.Tween[];

  constructor (params: ICharacter) {
    super(params.scene, params.x, params.y, params.texture, params.frame)
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    params.scene.physics.world.enable(this)
    this.body.gravity.y = DEFAULT_ACCEL_Y
    this.body.setAllowDrag(true)
    this.body.setDrag(200, 0)
    this.body.setFriction(0.7, 0)
    this.characterType = params.characterType

    for (var type in kingFrameMeta) {
      var frames = this.scene.anims.generateFrameNames('king', {
        start: 1,
        end: kingFrameMeta[type].frames,
        prefix: `${type}/`
      })
      this.scene.anims.create({
        key: `king_${type}`,
        frames,
        frameRate: 10,
        repeat: -1
      })
    }
    // input
    this.jumpKey = params.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )
    params.scene.add.existing(this)

    this.onCharacterChange()
  }

  onCharacterChange () {
    if (this.characterType === 'king') {
      this.body.setSize(80, 110)
      this.body.setOffset(25, 15)
      this.setScale(0.5, 0.5)
    }
  }

  update (): void {
    this.handleInput()
  }

  private animate (key: string, dirX: number = 1) {
    if (this.currentAnimationName === key && this.currentAnimationX === dirX) {
      return
    }
    this.currentAnimationName = key
    this.currentAnimationX = dirX
    this.flipX = dirX === -1
    this.anims.play(`${this.characterType}_${key}`, true)
  }

  private handleInput (): void {
    if (!this.body) {
      console.warn('character body not yet created?')
      return
    }
    const { cursors } = this
    if (cursors.left!.isDown) {
      this.body.setVelocityX(-160)
      this.animate('run', -1)
    } else if (cursors.right!.isDown) {
      this.body.setVelocityX(160)
      this.animate('run', 1)
    }
    if (cursors.down!.isDown && this.characterType === 'king') {
      this.body.acceleration.y < 300 && this.body.setAccelerationY(600)
      this.body.velocity.y < 400 && this.body.setVelocityY(400)
    } else {
      this.body.setAccelerationY(DEFAULT_ACCEL_Y)
    }
    if (this.body.onFloor()) {
      this.body.setAccelerationX(0)
      this.body.setDragX(400)
      if (!this.body.velocity.x) this.animate('idle')
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
