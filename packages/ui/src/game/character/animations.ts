import { assets } from '../../assets';

export const animate = (scene: Phaser.Scene) => {
  Object.entries(assets.textureFrameIndicies).map(([name, states]) => {
    Object.entries(states).map(([state /* e.g. idle, running */, {min, max}]) => {
      var frames = scene.anims.generateFrameNames(name, {
        start: min,
        end: max,
        prefix: `${state}/`,
      });
      scene.anims.create({
        key: `${name}_${state}`,
        frames,
        frameRate: 10,
        repeat: -1,
      });
    });
  });
};
