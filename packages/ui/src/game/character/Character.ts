import { CharacterType } from "common";
import { CharacterInitOptions } from "../../interfaces";
import Phaser from "phaser";

const DEFAULT_ACCEL_Y = 500;
const DEFAULT_ACCEL_X = 600 * 2;
const DEFAULT_MAX_VELOCITY_X = 250;

export class Character extends Phaser.GameObjects.Sprite {
  private jumpKey: Phaser.Input.Keyboard.Key;
  public body: Phaser.Physics.Arcade.Body;
  public characterType: CharacterType;
  public currentAnimationName!: string;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  public tween!: Phaser.Tweens.Tween;
  public canFlap: boolean;

  /**
   * @warn So this is a bit of a nightmare. Here's the scoop.
   * A Sprite can be flipped. However, flipping a sprite always flips the tile's
   * image about it's true x center, _not_ the set x origin. That means that the the body
   * get's flipped nicely about it's x origin, but the image is flipped about
   * it's literal center. Thus, we need to adjust the body's position when we flip
   * the image so that the body is still in the right place relative to the image.
   * The values below are unscaled values.
   */
  private handledXFlip: boolean = false;
  private collisionBoxWidth: number = 80;
  private collisionBoxHeight: number = 100;
  private collisionBoxXOffset: number = 30;
  private collisionBoxYOffset = 30;
  // @warn this value must correlate strictly to the image, not where you want the bounding box.
  private kingXCenterOffsetPercentFromLeft: number = 0.35;
  private kingXCenterOffsetPxFromFromLeft: number =
    this.width * this.kingXCenterOffsetPercentFromLeft;
  private kingXCenterOffsetPxFromRight: number = this.width - this.kingXCenterOffsetPxFromFromLeft;

  /**
   * flipX true center px  - flipX false center px
   */
  private spriteFlippedXCenterDeltaPx = this.kingXCenterOffsetPxFromRight -
    this.kingXCenterOffsetPxFromFromLeft;

  constructor(params: CharacterInitOptions) {
    super(params.scene, params.x, params.y, params.texture, params.frame);
    const scale = params.characterType === "king" ? 0.5 : 0.6;
    this.scale = scale;

    // ssshhhhhhh typescript shhhh
    this.body = (this as any).body as Phaser.Physics.Arcade.Body;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    params.scene.physics.world.enable(this);
    this.body.gravity.y = DEFAULT_ACCEL_Y;
    this.body.setAllowDrag(true);
    this.body.setDrag(200, 0);
    this.body.setFriction(0.7, 0);
    this.characterType = params.characterType;
    this.canFlap = true;
    this.body.setBounce(0, 0);


    this.spriteFlippedXCenterDeltaPx

    // input
    this.jumpKey = params.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    params.scene.add.existing(this);

    this.onCharacterChange();
  }

  onCharacterDirChange() {
    if (this.characterType !== "king") return;
    if (this.flipX) {
      if (this.handledXFlip) return;
      this.handledXFlip = true;
      this.body.position.x -= this.spriteFlippedXCenterDeltaPx *this.scale;
      this.body.setOffset(
        (this.width - this.collisionBoxWidth - this.collisionBoxXOffset),
        (this.collisionBoxYOffset),
      );
    } else {
      this.handledXFlip = false;
      if (this.body.offset.x === this.collisionBoxXOffset) return;
      this.body.setOffset(
        this.collisionBoxXOffset,
        this.collisionBoxYOffset
      );
      this.body.position.x += this.spriteFlippedXCenterDeltaPx * this.scale;
    }
  }

  onCharacterChange() {
    if (this.characterType === "king") {
      this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight, false);
      this.body.setOffset(this.collisionBoxXOffset, this.collisionBoxYOffset);
    } else if (this.characterType === "peon") {
      this.body.setSize(50, 90);
      this.body.setOffset(16, 20);
    }
  }

  update(): void {
    if (this.body.immovable) return;
    this.handleInput();
  }

  public animate(key: string) {
    if (this.currentAnimationName === key) return;
    this.currentAnimationName = key;
    this.anims.play(`${this.characterType}_${key}`, true);
  }

  private maybeRunAnimate() {
    if (this.currentAnimationName === "jump") {
      return this.body.velocity.y != 0 ? null : this.animate("run");
    }
    if (this.currentAnimationName !== "run") {
      this.animate("run");
    }
  }

  private handleInput(): void {
    if (this.body.immovable) {
      return;
    }
    if (!this.body) {
      console.warn("character body not yet created?");
      return;
    }
    const { cursors } = this;

    if (cursors.left!.isDown) {
      this.body.setAccelerationX(-DEFAULT_ACCEL_X);
      this.setFlipX(true);
      this.maybeRunAnimate();
    } else if (cursors.right!.isDown) {
      this.setFlipX(false);
      this.body.setAccelerationX(DEFAULT_ACCEL_X);
      this.maybeRunAnimate();
    }
    if (this.body.velocity.x > DEFAULT_MAX_VELOCITY_X) {
      this.body.velocity.x = DEFAULT_MAX_VELOCITY_X;
    } else if (this.body.velocity.x < -DEFAULT_MAX_VELOCITY_X) {
      this.body.velocity.x = -DEFAULT_MAX_VELOCITY_X;
    }
    if (cursors.down!.isDown && this.characterType === "king") {
      this.body.acceleration.y < 300 && this.body.setAccelerationY(600);
      this.body.velocity.y < 400 && this.body.setVelocityY(400);
    } else {
      this.body.setAccelerationY(DEFAULT_ACCEL_Y);
    }
    const isAccelleratingX = cursors.left!.isDown || cursors.right!.isDown;
    if (this.body.onFloor()) {
      if (!isAccelleratingX) {
        this.body.setAccelerationX(0);
        if (this.currentAnimationName !== "idle") this.animate("idle");
      }
      this.body.setDragX(600);
    } else {
      if (!isAccelleratingX) this.body.setAccelerationX(0);
      this.body.setDragX(200);
    }
    if (this.jumpKey.isUp) this.canFlap = true;
    const isFlapping =
      this.canFlap && this.jumpKey.isDown && this.body.velocity.y >= -200;

    if (isFlapping) {
      this.canFlap = false;
      this.flap();
    }

    this.onCharacterDirChange();
  }

  public flap(): void {
    if (this.currentAnimationName !== "jump") this.animate("jump");
    this.body.setVelocityY(-300);
  }
}
