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
    return (
      this.teamA.playersRegistrations.length +
        this.teamB.playersRegistrations.length >=
      this.maxPlayersPerTeam * 2
    )
  }

  getPlayerTeam (player: common.PlayerRegistration) {
    return player.tid === 'blue' ? this.teamA : this.teamB
  }

  get playerRegistrations () {
    return this.teamA.playersRegistrations.concat(
      this.teamB.playersRegistrations
    )
  }

  getPlayer (uuid: number): common.PlayerRegistration | null {
    return this.teamA.getPlayer(uuid) || this.teamB.getPlayer(uuid)
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
    return targetTeam.registerPlayer()
  }

  removePlayer (player: common.PlayerRegistration) {
    this.getPlayerTeam(player).removePlayer(player)
  }

  setPlayerBodyState (
    player: common.PlayerRegistration,
    playerBodyState: common.PlayerBodyState
  ) {
    this.getPlayerTeam(player).setPlayerBodyState(player, playerBodyState)
  }

  get state (): common.CentralGameState {
    return {
      playerStateByUuid: Object.assign(
        {},
        this.teamA.playerStatesById,
        this.teamB.playerStatesById
      ) as common.PlayerStateByUuid
    }
  }
}
