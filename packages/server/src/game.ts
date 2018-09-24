import * as common from 'common'
import { Team } from './team'

export type GameOptions = {
  id: number
}

export class Game {
  public teamA: Team
  public teamB: Team
  public maxPlayersPerTeam: number
  public id: number
  public playerStateChangeCounter: number = 0

  constructor (opts: GameOptions) {
    this.id = opts.id
    this.maxPlayersPerTeam = 5
    this.teamA = new Team({
      color: 'blue',
      gameId: this.id,
      maxPlayers: this.maxPlayersPerTeam,
      players: []
    })
    this.teamB = new Team({
      color: 'orange',
      gameId: this.id,
      maxPlayers: this.maxPlayersPerTeam,
      players: []
    })
  }

  get gameFull () {
    return this.teamA.players.length + this.teamB.players.length >= this.maxPlayersPerTeam * 2
  }

  getPlayerTeam (player: common.PlayerState) {
    return player.teamId === 'blue' ? this.teamA : this.teamB
  }

  // get playerRegistrations () {
  //   return this.teamA.playersRegistrations.concat(
  //     this.teamB.playersRegistrations
  //   )
  // }

  get players () {
    return this.teamA.players.concat(this.teamB.players)
  }

  getPlayer (uuid: number): common.PlayerState | null {
    return this.teamA.getPlayer(uuid) || this.teamB.getPlayer(uuid)
  }

  registerPlayer (teamColor?: common.TeamColor) {
    let targetTeam: Team
    if (!teamColor) {
      // assign to team with less players
      targetTeam = this.teamA.players.length > this.teamB.players.length ? this.teamB : this.teamA
    } else {
      targetTeam = teamColor === 'blue' ? this.teamA : this.teamB
    }
    ++this.playerStateChangeCounter
    return targetTeam.registerPlayer()
  }

  removePlayer (player: common.PlayerState) {
    ++this.playerStateChangeCounter
    this.getPlayerTeam(player).removePlayer(player)
  }

  setPlayerState (player: common.PlayerState, playerBodyState: common.PlayerBodyState) {
    player.playerBodyState = playerBodyState
    player.lastUpdateTime = Date.now()
  }

  get state (): common.CentralGameState {
    return {
      serverTime: Date.now(),
      playerStateChangeCounter: this.playerStateChangeCounter,
      playerStateByUuid: Object.assign(
        {},
        this.teamA.playersByUuid,
        this.teamB.playersByUuid
      ) as common.PlayerStateByUuid
    }
  }
}
