import WebSocket = require('ws')
import {
  KingClientMessage,
  KingServerMessage,
  PlayerRegistration
} from 'common'
import { Game } from './game'
import { debounce } from 'lodash'

const wss = new WebSocket.Server({ port: 9999 })
wss.on('connection', onConnect)

// state
const gamesById = {
  '1': new Game()
}
const playerAndGameBySocket = new WeakMap<
  WebSocket,
  [PlayerRegistration, Game]
  >()

// event handlers
export function onConnect (ws: WebSocket) {
  ws.on('message', (msg: string) => onMessage(msg, ws))
  ws.on('close', () => onClose(ws))
}

export function onClose (ws: WebSocket) {
  const res = playerAndGameBySocket.get(ws)
  if (!res) return console.warn('player not found for socket on close')
  const [player, game] = res
  game.removePlayer(player)
  broadcast(game, {
    type: KingServerMessage.HANDLE_PLAYER_DISCONNECTED,
    payload: player
  })
}
export function onMessage (raw: string, ws: WebSocket) {
  const message = JSON.parse(raw)
  const gameId = '1'
  let game = gamesById[gameId]
  const { type, payload } = message
  if (type === KingClientMessage.NEW_GAME) {
    // create game in gamesById
  } else if (type === KingClientMessage.REQUEST_CHARACTER) {
    const isPlayerPrexisting = playerAndGameBySocket.has(ws)
    const player = isPlayerPrexisting
      ? playerAndGameBySocket.get(ws)![0]
      : game.registerPlayer()
    playerAndGameBySocket.set(ws, [player, game])
    emit(
      {
        type: KingServerMessage.ASSIGN_CHARACTER,
        payload: player
      },
      ws
    )
    broadcast(
      game,
      { type: KingServerMessage.HANDLE_NEW_PLAYER, payload: player },
      ws
    )
  } else if (type === KingClientMessage.REQUEST_PLAYERS) {
    emit(
      {
        type: KingServerMessage.PLAYER_REGISTRATIONS,
        payload: game.playerRegistrations
      },
      ws
    )
  } else if (type === KingClientMessage.PLAYER_BODY_STATE) {
    game.setPlayerBodyState(playerAndGameBySocket.get(ws)![0], payload)
    broadcastDebounced(game, {
      type: KingServerMessage.UPDATE_GAME_STATE,
      payload: game.state
    })
  } else if (type === KingClientMessage.KILL_PLAYER) {
    // @TODO ...be smart about killing off players!
  } else {
    throw new Error(`UNSUPPORTED MESSAGE: ${raw}`)
  }
}

// socket utils

export const emit = (msg: object, ws: WebSocket) => ws.send(JSON.stringify(msg))
export const broadcast = (
  game: Game,
  data: any,
  omitSocket: WebSocket | null = null
) =>
  wss.clients.forEach(ws => {
    if (omitSocket && ws === omitSocket) return
    const res = playerAndGameBySocket.get(ws)
    if (!res || res[1] !== game) return
    ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(data))
  })

export const broadcastDebounced = debounce(broadcast, 10, {
  leading: true,
  maxWait: 20
})
