import { CharacterType } from 'common'

type ICharacter = {
  scene: Phaser.Scene
  x: number
  y: number
  texture: string
  frame?: string | integer
  characterType: CharacterType
}

const KING_FRAME_META = {
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

const KNIGHT_FRAME_META = {
  walk: {
    frames: 10
  },
  run: {
    frames: 10
  },
  dead: {
    frames: 10
  },
  idle: {
    frames: 10
  },
  jump: {
    frames: 10
  }
}

const PEON_FRAME_META = {
  walk: {
    frames: 10
  },
  run: {
    frames: 10
  },
  dead: {
    frames: 10
  },
  idle: {
    frames: 10
  },
  jump: {
    frames: 10
  }
}

const DEFAULT_ACCEL_Y = 500
const DEFAULT_ACCEL_X = 600 * 2
const DEFAULT_MAX_VELOCITY_X = 250

export class Character extends Phaser.GameObjects.Sprite {
  private jumpKey: Phaser.Input.Keyboard.Key
  public body: Phaser.Physics.Arcade.Body
  public characterType: CharacterType
  public currentAnimationName: string
  public cursors: CursorKeys
  public tween: Phaser.Tweens.Tween
  public canFlap: boolean

  constructor (params: ICharacter) {
    super(params.scene, params.x, params.y, params.texture, params.frame)
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    params.scene.physics.world.enable(this)
    this.body.gravity.y = DEFAULT_ACCEL_Y
    this.body.setAllowDrag(true)
    this.body.setDrag(200, 0)
    this.body.setFriction(0.7, 0)
    this.characterType = params.characterType
    this.canFlap = true

    this.body.setBounce(0, 0)

    // input
    this.jumpKey = params.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )
    params.scene.add.existing(this)

    this.onCharacterChange()
  }

  static createAnimations (scene: Phaser.Scene) {
    ;[
      { name: 'king', meta: KING_FRAME_META },
      { name: 'knight', meta: KNIGHT_FRAME_META },
      { name: 'peon', meta: PEON_FRAME_META }
    ].forEach(({ name, meta }) => {
      for (var type in meta as any) {
        var frames = scene.anims.generateFrameNames(name, {
          start: 1,
          end: meta[type].frames,
          prefix: `${type}/`
        })
        scene.anims.create({
          key: `${name}_${type}`,
          frames,
          frameRate: 10,
          repeat: -1
        })
      }
    })
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

  public animate (key: string) {
    if (this.currentAnimationName === key) return
    this.currentAnimationName = key
    this.anims.play(`${this.characterType}_${key}`, true)
  }

  private handleInput (): void {
    if (!this.body) {
      console.warn('character body not yet created?')
      return
    }
    const { cursors } = this
    if (cursors.left!.isDown) {
      this.body.setAccelerationX(-DEFAULT_ACCEL_X)
      this.setFlipX(true)
      this.animate('run')
    } else if (cursors.right!.isDown) {
      this.setFlipX(false)
      this.body.setAccelerationX(DEFAULT_ACCEL_X)
      this.animate('run')
    }
    if (this.body.velocity.x > DEFAULT_MAX_VELOCITY_X) {
      this.body.velocity.x = DEFAULT_MAX_VELOCITY_X
    } else if (this.body.velocity.x < -DEFAULT_MAX_VELOCITY_X) {
      this.body.velocity.x = -DEFAULT_MAX_VELOCITY_X
    }
    if (cursors.down!.isDown && this.characterType === 'king') {
      this.body.acceleration.y < 300 && this.body.setAccelerationY(600)
      this.body.velocity.y < 400 && this.body.setVelocityY(400)
    } else {
      this.body.setAccelerationY(DEFAULT_ACCEL_Y)
    }
    const isAccelleratingX = cursors.left!.isDown || cursors.right!.isDown
    if (this.body.onFloor()) {
      if (!isAccelleratingX) {
        this.body.setAccelerationX(0)
      }
      this.body.setDragX(600)
      if (!this.body.velocity.x) this.animate('idle')
    } else {
      if (!isAccelleratingX) this.body.setAccelerationX(0)
      this.body.setDragX(200)
    }
    if (this.jumpKey.isUp) this.canFlap = true
    const isFlapping =
      this.canFlap && this.jumpKey.isDown && this.body.velocity.y >= -200

    if (isFlapping) {
      this.canFlap = false
      this.flap()
    }
  }

  public flap (): void {
    this.body.setVelocityY(-300)
  }
}
