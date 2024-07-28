export const assets = {
  textureFrameIndicies: {
    king: {
      dead: {
        min: 1,
        max: 8,
      },
      idle: {
        min: 1,
        max: 10,
      },
      jump: {
        min: 1,
        max: 12,
      },
      run: {
        min: 1,
        max: 8,
      },
      walk: {
        min: 1,
        max: 10,
      },
    },
    peon: {
      jump: {
        min: 0,
        max: 9,
      },
      run: {
        min: 1,
        max: 8,
      },
      dead: {
        min: 0,
        max: 9,
      },
      walk: {
        min: 0,
        max: 9,
      },
      idle: {
        min: 0,
        max: 9,
      },
      slide: {
        min: 0,
        max: 9,
      },
    },
    knight: {
      jump: {
        min: 0,
        max: 9,
      },
      walk: {
        min: 0,
        max: 9,
      },
      run: {
        min: 0,
        max: 9,
      },
      dead: {
        min: 0,
        max: 9,
      },
      jumpattack: {
        min: 0,
        max: 9,
      },
      attack: {
        min: 0,
        max: 9,
      },
      idle: {
        min: 0,
        max: 9,
      },
    },
  },
} as const;
