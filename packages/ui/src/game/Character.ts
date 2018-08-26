
type ICharacter = {
  scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | integer
}

export class Character extends Phaser.GameObjects.Sprite {
  private isDead: boolean = false;
  private jumpKey: Phaser.Input.Keyboard.Key
  public body: Phaser.Physics.Arcade.Body
  public cursors: CursorKeys
  // private anim: Phaser.Tweens.Tween[];

  constructor(params: ICharacter) {
    super(params.scene, params.x, params.y, params.texture, params.frame)
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    params.scene.physics.world.enable(this);
    this.body.gravity.y = 500

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

  update(): void {
    // this.handleAngleChange()
    this.handleInput()
    this.isOffTheScreen()
  }

  // private handleAngleChange(): void {
  //   if (this.angle < 20) this.angle += 1
  // }

  private handleInput(): void {
    const { cursors } = this
    if (cursors.left!.isDown) this.body.setVelocityX(-160)
    else if (cursors.right!.isDown) this.body.setVelocityX(160)
    else this.body.setVelocityX(0)
    const isFlapping = this.jumpKey.isDown && this.jumpKey.repeats < 2 && this.body.velocity.y >= -100
    if (isFlapping) this.flap()
  }

  public flap(): void {
    this.body.setVelocityY(-200);
  }

  private isOffTheScreen(): void {
    if (this.y + this.height > this.scene.sys.canvas.height) {
      this.isDead = true;
    }
  }
}
