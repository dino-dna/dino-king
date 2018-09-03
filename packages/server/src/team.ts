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

  getPlayer (uuid: number): common.PlayerRegistration | null {
    return this.playersRegistrations.find(reg => reg.uuid === uuid) || null
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
      gid: this.gameId,
      characterType: this.playersRegistrations.length ? 'peon' : 'king'
    }
    this.playersRegistrations.push(registration)
    return registration
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

  setPlayerBodyState (
    reg_: common.PlayerRegistration,
    playerBodyState: common.PlayerBodyState
  ) {
    const registration = this.playersRegistrations.find(
      reg => reg.uid === reg_.uid
    )
    if (!registration) throw new Error('player registration not found')
    const state = this.playerStateByRegistration.get(registration)
    if (!state) {
      this.playerStateByRegistration.set(registration, {
        playerBodyState,
        isAlive: true
      })
    } else state.playerBodyState = playerBodyState
  }

  get playerStatesById () {
    return this.playersRegistrations.reduce(
      (agg: common.PlayerStateByUuid, reg) => {
        let state = this.playerStateByRegistration.get(reg)
        if (!state) return agg
        agg[reg.uuid] = state
        return agg
      },
      {}
    )
  }
}
