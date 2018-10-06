import { debounce } from 'lodash'
import { Game } from './game'
import { KingClientMessage, KingServerMessage, PlayerState, DEATH_ANIMATION_DURATION } from 'common'
import { promisify } from 'util'
import pino from 'pino'
import WebSocket = require('ws')

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9999

const log = pino({
  level: 'debug',
  prettyPrint: !!(process.env.NODE_ENV || 'production').match(/dev/i)
})

const wss = new WebSocket.Server({ path: '/api', port })
wss.on('connection', onConnect)
log.info(`listening on ${port}`)

// state
const gamesById: { [id: string]: Game } = {
  '1': new Game({ id: 1 })
}
const playerAndGameBySocket = new WeakMap<WebSocket, [PlayerState, Game]>()

// event handlers
export function onConnect (ws: WebSocket) {
  ws.on('message', (msg: string) => onMessage(msg, ws))
  ws.on('close', () => onClose(ws))
}

export function onClose (ws: WebSocket) {
  const res = playerAndGameBySocket.get(ws)
  if (!res) return console.warn('player not found for socket on close')
  const [player, game] = res
  log.info(`removing player ${player.uuid} from game ${player.gameId}`)
  game.removePlayer(player)
  broadcast(game, {
    type: KingServerMessage.HANDLE_PLAYER_DISCONNECTED,
    payload: player
  })
}

export function onMessage (raw: string, ws: WebSocket) {
  const message = JSON.parse(raw)
  let game = gamesById['1'] // @TODO, i dont know. support many games?
  const { type, payload } = message
  log.info(raw)

  const broadcastGameState = () => {
    if (!game) return
    broadcastDebounced(game, {
      type: KingServerMessage.UPDATE_GAME_STATE,
      payload: game.state
    })
  }
  if (type === KingClientMessage.NEW_GAME) {
    // create game in gamesById
  } else if (type === KingClientMessage.REQUEST_CHARACTER) {
    const player = game.registerPlayer()
    playerAndGameBySocket.set(ws, [player, game])
    log.debug(`created player`, player)
    emit(
      {
        type: KingServerMessage.ASSIGN_CHARACTER,
        payload: player.uuid
      },
      ws
    )
    broadcastGameState()
  } else if (type === KingClientMessage.PLAYER_BODY_STATE) {
    game.setPlayerState(playerAndGameBySocket.get(ws)![0], payload)
    broadcastGameState()
  } else if (type === KingClientMessage.KILL_PLAYER) {
    const { killed, killedBy } = payload
    const killedPlayer = game.getPlayer(killed)
    if (!killedPlayer) {
      return log.warn(`player ${killed} not found in game state`)
    }
    killedPlayer.isAlive = false
    if (killedPlayer.characterType === 'knight') killedPlayer.characterType = 'peon'
    game.getPlayerTeam(killedPlayer).respawn({ delay: DEATH_ANIMATION_DURATION, player: killedPlayer })
    broadcast(game, {
      type: KingServerMessage.KILL_PLAYER,
      payload: { uuid: killed }
    })
  } else {
    throw new Error(`UNSUPPORTED MESSAGE: ${raw}`)
  }
}

// socket utils

export const emit = (msg: object, ws: WebSocket) => ws.send(JSON.stringify(msg))
export const broadcast = (game: Game, data: any, omitSocket: WebSocket | null = null) => {
  log.debug(Object.keys(game.state.playerStateByUuid).join(', '))
  const sent: Promise<void>[] = Array.from(wss.clients).map(ws => {
    if (omitSocket && ws === omitSocket) return Promise.resolve()
    const res = playerAndGameBySocket.get(ws)
    if (!res || res[1] !== game) return Promise.resolve()
    return new Promise((res, rej) => {
      ws.send(JSON.stringify(data), err => (err ? rej(err) : res()))
    })
  })
  return Promise.all(sent)
}

export const broadcastDebounced = debounce(broadcast, 50, {
  // leading: true,
  maxWait: 50
})
;['SIGINT', 'SIGHUP'].forEach(signal => {
  process.on(signal as any, async () => {
    for (let game of Object.values(gamesById)) {
      log.info(`shutting down. broadcasting KingServerMessage.TEARDOWN`)
      try {
        await broadcast(game, { type: KingServerMessage.TEARDOWN })
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
      wss.close(err => {
        if (err) throw err
        process.exit(signal === 'SIGHUP' ? 0 : 1)
      })
    }
  })
})
