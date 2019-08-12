import { KING as KING_FRAME_META, KNIGHT as KNIGHT_FRAME_META, PEON as PEON_FRAME_META, SpriteSheets } from './frames'

export const animate = (scene: Phaser.Scene) => {
  ;[
    { name: 'king', meta: KING_FRAME_META },
    { name: 'knight', meta: KNIGHT_FRAME_META },
    { name: 'peon', meta: PEON_FRAME_META }
  ].forEach(({ name, meta }) => {
    for (var type in meta as any) {
      var frames = scene.anims.generateFrameNames(SpriteSheets.CHARACTERS.name, {
        start: 1,
        end: meta[type].frames,
        prefix: `${name}/${type}/`
      })
      if (!frames.length) throw new Error(`unable to find frames for ${name} - ${type}`)
      scene.anims.create({
        key: `${name}/${type}`,
        frames,
        frameRate: 10,
        repeat: -1
      })
    }
  })
}
