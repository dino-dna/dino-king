export type StateFrameCountMap = {
  [action: string]: {
    frames: number
  }
}
export const KING: StateFrameCountMap = {
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

export const KNIGHT: StateFrameCountMap = {
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

export const PEON: StateFrameCountMap = {
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
