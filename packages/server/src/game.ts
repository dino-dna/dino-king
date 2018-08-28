import * as common from 'common'
import { TeamFullError } from './errors'

export interface NewTeamOptions {
  color: common.TeamColor
  maxPlayers?: number
  players: common.PlayerRegistration[]
}
export class Team {
  public color: common.TeamColor
  public maxPlayers: number
  public static playerIdCounter: number = 0 // if we get real popular...overflow :)
  public playersRegistrations: common.PlayerRegistration[]
  public playerStateByRegistration: WeakMap<
    common.PlayerRegistration,
    common.PlayerState
  >

  constructor (opts: NewTeamOptions) {
    this.color = opts.color
    this.playersRegistrations = []
    this.maxPlayers = opts.maxPlayers || 5
    this.playerStateByRegistration = new WeakMap()
  }

  get isFull () {
    return this.playersRegistrations.length >= this.maxPlayers
  }

  registerPlayer () {
    ++Team.playerIdCounter
    const registration: common.PlayerRegistration = {
      id: Team.playerIdCounter,
      characterConfig: {
        team: this.color,
        type: this.playersRegistrations.length ? 'peon' : 'king'
      }
    }
    this.playersRegistrations.push(registration)
    return registration
  }

  removePlayer (player: common.PlayerRegistration) {
    this.playersRegistrations = this.playersRegistrations.filter(
      existing => player.id !== existing.id
    )
  }

  setPlayerPosition (
    reg_: common.PlayerRegistration,
    position: Phaser.Math.Vector2
  ) {
    const registration = this.playersRegistrations.find(
      reg => reg.id === reg_.id
    )
    if (!registration) throw new Error('player registration not found')
    const state = this.playerStateByRegistration.get(registration)
    if (!state) {
      this.playerStateByRegistration.set(registration, {
        position,
        isAlive: true
      })
    } else state.position = position
  }

  get playerStatesById () {
    return this.playersRegistrations.reduce(
      (agg: common.PlayerStateById, reg) => {
        let state = this.playerStateByRegistration.get(reg)
        if (!state) return agg
        agg[reg.id] = state
        return agg
      },
      {}
    )
  }
}

export class Game {
  public teamA: Team
  public teamB: Team
  public maxPlayersPerTeam: number

  constructor () {
    this.maxPlayersPerTeam = 5
    this.teamA = new Team({
      color: 'blue',
      maxPlayers: this.maxPlayersPerTeam,
      players: []
    })
    this.teamB = new Team({
      color: 'orange',
      maxPlayers: this.maxPlayersPerTeam,
      players: []
    })
  }

  get gameFull () {
    return (
      this.teamA.playersRegistrations.length +
        this.teamB.playersRegistrations.length >=
      this.maxPlayersPerTeam * 2
    )
  }

  getPlayerTeam (player: common.PlayerRegistration) {
    return player.characterConfig.team === 'blue' ? this.teamA : this.teamB
  }

  get playerRegistrations () {
    return this.teamA.playersRegistrations.concat(
      this.teamB.playersRegistrations
    )
  }

  registerPlayer (teamColor?: common.TeamColor) {
    let targetTeam: Team
    if (!teamColor) {
      // assign to team with less players
      targetTeam =
        this.teamA.playersRegistrations.length >
        this.teamB.playersRegistrations.length
          ? this.teamB
          : this.teamA
    } else {
      targetTeam = teamColor === 'blue' ? this.teamA : this.teamB
    }
    if (targetTeam.isFull) throw new TeamFullError()
    return targetTeam.registerPlayer()
  }

  removePlayer (player: common.PlayerRegistration) {
    this.getPlayerTeam(player).removePlayer(player)
  }

  setPlayerPosition (
    player: common.PlayerRegistration,
    position: Phaser.Math.Vector2
  ) {
    this.getPlayerTeam(player).setPlayerPosition(player, position)
  }

  get state (): common.CentralGameState {
    return {
      playerStateById: Object.assign(
        {},
        this.teamA.playerStatesById,
        this.teamB.playerStatesById
      ) as common.PlayerStateById
    }
  }
}
