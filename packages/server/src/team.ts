import * as common from 'common'
import { TeamFullError } from './errors'

export interface NewTeamOptions {
  color: common.TeamColor
  gameId: number
  maxPlayers?: number
  players: common.PlayerRegistration[]
}
export class Team {
  public color: common.TeamColor
  public gameId: number
  public maxPlayers: number
  public playerIdCounter: number
  public playersRegistrations: common.PlayerRegistration[]
  public playerStateByRegistration: WeakMap<
    common.PlayerRegistration,
    common.PlayerState
  >
  public static uuid: number = 0

  constructor (opts: NewTeamOptions) {
    this.color = opts.color
    this.gameId = opts.gameId
    this.playersRegistrations = []
    this.maxPlayers = opts.maxPlayers || 5
    this.playerStateByRegistration = new WeakMap()
    this.playerIdCounter = 0
  }

  getPlayer (uuid: number): common.ServerPlayer | null {
    const registration = this.playersRegistrations.find(
      reg => reg.uuid === uuid
    )
    if (!registration) return null
    return {
      registration,
      state: this.playerStateByRegistration.get(registration)!
    }
  }

  get isFull () {
    return this.playersRegistrations.length >= this.maxPlayers
  }

  get registrationsById () {
    return this.playersRegistrations.reduce((agg: any, reg) => {
      agg[reg.uid] = reg
      return agg
    }, {})
  }

  registerPlayer () {
    if (this.isFull) throw new TeamFullError()
    ++Team.uuid
    const regById = this.registrationsById
    let playerId = 0
    while (playerId in regById) ++playerId
    const registration: common.PlayerRegistration = {
      uuid: Team.uuid,
      uid: playerId,
      tid: this.color,
      gid: this.gameId
    }
    this.playersRegistrations.push(registration)
    const playerState: common.PlayerState = {
      characterType: this.playersRegistrations.length ? 'peon' : 'king',
      isAlive: true,
      lastUpdateTime: Date.now(),
      playerBodyState: {
        currentAnimationName: '__init__',
        acceleration: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        position: { x: 0, y: 0 }
      }
    }
    this.playerStateByRegistration.set(registration, playerState)
    const player: common.ServerPlayer = {
      state: playerState,
      registration
    }
    return player
  }

  removePlayer (player: common.PlayerRegistration) {
    const prevNumRegistrations = this.playersRegistrations.length
    this.playersRegistrations = this.playersRegistrations.filter(
      existing => player.uid !== existing.uid
    )
    if (prevNumRegistrations === this.playersRegistrations.length) {
      throw new Error('failed to revome player from team')
    }
  }

  get playerStatesByUuid () {
    return this.playersRegistrations.reduce(
      (agg: common.PlayerStateByUuid, reg) => {
        let state = this.playerStateByRegistration.get(reg)
        if (!state) throw new Error(`state for player ${reg.uuid} not found`)
        agg[reg.uuid] = state
        return agg
      },
      {}
    )
  }
}
