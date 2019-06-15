import * as common from 'common'
import { TeamFullError } from './errors'
import pino from 'pino'
import bluebird from 'bluebird'

export interface NewTeamOptions {
  color: common.TeamColor
  gameId: number
  maxPlayers?: number
  players: common.PlayerState[]
  log: pino.Logger
}
export class Team {
  public color: common.TeamColor
  public gameId: number
  public log: pino.Logger
  public maxPlayers: number
  public playerIdCounter: number
  public players: common.PlayerState[]

  public static uuid: number = 0

  constructor (opts: NewTeamOptions) {
    this.color = opts.color
    this.gameId = opts.gameId
    this.players = []
    this.maxPlayers = opts.maxPlayers || 5
    this.playerIdCounter = 0
    this.log = opts.log
  }

  getPlayer (uuid: number): common.PlayerState | null {
    return this.players.find(reg => reg.uuid === uuid) || null
  }

  get isFull () {
    return this.players.length >= this.maxPlayers
  }

  get playersById () {
    return this.players.reduce((agg: any, reg) => {
      agg[reg.teamPlayerId] = reg
      return agg
    }, {})
  }

  get playersByUuid () {
    return this.players.reduce(
      (agg: common.PlayerStateByUuid, reg) => {
        agg[reg.uuid] = reg
        return agg
      },
      {} as common.PlayerStateByUuid
    )
  }

  registerPlayer () {
    if (this.isFull) throw new TeamFullError()
    ++Team.uuid
    let teamPlayerId = 0
    while (teamPlayerId in this.playersById) ++teamPlayerId
    const player: common.PlayerState = {
      characterType: this.players.length ? 'peon' : 'king',
      gameId: this.gameId,
      isAlive: true,
      lastUpdateTime: Date.now(),
      playerBodyState: {
        currentAnimationName: '__init__',
        acceleration: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        position: { x: 0, y: 0 }
      },
      teamId: this.color,
      teamPlayerId,
      uuid: Team.uuid
    }
    this.players.push(player)
    return player
  }

  removePlayer (player: common.PlayerState) {
    const previousPlayerCount = this.players.length
    this.players = this.players.filter(existing => player.teamPlayerId !== existing.teamPlayerId)
  }

  async respawn (opts: { delay: number; player: common.PlayerState }) {
    const { delay, player } = opts
    if (!this.playersByUuid[player.uuid]) throw new Error(`player uuid ${player.uuid} is not on this team!`)
    await bluebird.delay(delay)
    const playerState = this.playersByUuid[player.uuid]
    playerState.isAlive = true
    return this.log.info(`player ${player.uuid} is respawning`)
  }
}
