import { debounce } from "lodash";
import { Game } from "./game";
import {
  KingToServerMessage,
  KingToClientMessage,
  PlayerState,
  DEATH_ANIMATION_DURATION,
  ToClient,
  ToServer,
  nevMessage,
} from "common";
import pino from "pino";
import WebSocket from "ws";
import { tryOr } from "./result";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9999;

const log = pino({
  level: "debug",
  prettyPrint: !!(process.env.NODE_ENV || "production").match(/dev/i),
});

const tryOrWarn = (fn: () => Promise<void> | void) =>
  tryOr(fn, async (err) => log.warn(String(err)));

const wss = new WebSocket.Server({ path: "/api", port });
wss.on("connection", onConnect);
log.info(`listening on ${port}`);

// state
const gamesById: { [id: string]: Game } = {
  "1": new Game({ id: 1, log }),
};
const playerAndGameBySocket = new WeakMap<WebSocket, [PlayerState, Game]>();

let socketCounter = 0;
// event handlers
export function onConnect(ws: WebSocket) {
  ++socketCounter;
  const socketId = socketCounter;
  ws.on("message", (msg: string) =>
    tryOrWarn(() => onMessage(msg, ws, socketId)),
  );
  ws.on("close", () => tryOrWarn(() => onClose(ws, socketId)));
}

const withPlayerGame = async <R>(
  ws: WebSocket,
  fn: (player: PlayerState, game: Game) => R,
): Promise<void> => {
  const res = playerAndGameBySocket.get(ws);
  if (!res) return;
  const [player, game] = res;
  await fn(player, game);
};

export function onClose(ws: WebSocket, socketId: number) {
  const res = playerAndGameBySocket.get(ws);
  if (!res) {
    return console.warn(`player not found for socket ${socketId} on close`);
  }
  const [player, game] = res;
  log.info(`removing player ${player.uuid} from game ${player.gameId}`);
  game.removePlayer(player);
  broadcast(game, {
    type: "HANDLE_PLAYER_DISCONNECTED",
    payload: player,
  });
}

export function onMessage(raw: string, ws: WebSocket, socketId: number) {
  const message = JSON.parse(raw);
  let game = gamesById["1"];
  const { type, payload } = message as ToServer;

  // log.info({socketId, message});

  const broadcastGameState = () => {
    if (!game) return;
    broadcastDebounced(game, {
      type: "UPDATE_GAME_STATE",
      payload: game.state,
    });
  };

  if (type === KingToServerMessage.NEW_GAME) {
    // create game in gamesById
  } else if (type === KingToServerMessage.REQUEST_CHARACTER) {
    const pg = playerAndGameBySocket.get(ws);
    if (!pg) {
      throw new Error("player not found for socket");
    }
    const [player] = pg;
    emit(
      {
        type: "ASSIGN_CHARACTER",
        payload: player.uuid,
      },
      ws,
    );
    broadcastGameState();
  } else if (type === KingToServerMessage.PLAYER_BODY_STATE) {
    game?.setPlayerState(playerAndGameBySocket.get(ws)![0], payload);
    broadcastGameState();
  } else if (type === KingToServerMessage.KILL_PLAYER) {
    withPlayerGame(ws, (player, game) => {
      const { killedId } = payload;
      const killedPlayer = game.getPlayer(killedId);
      if (!killedPlayer) {
        return log.warn(`player ${killedId} not found in game state`);
      }
      if (!killedPlayer.isAlive) {
        return log.warn(`played killed twice--omitting kill event`);
      }
      killedPlayer.isAlive = false;
      if (killedPlayer.characterType === "knight") {
        // huh, downgrade? dont recall this
        killedPlayer.characterType = "peon";
      }
      const respawnedP = game
        .getPlayerTeam(killedPlayer)
        .respawn({ delay: DEATH_ANIMATION_DURATION, player: killedPlayer });
      broadcast(game, {
        type: "KILL_PLAYER",
        payload: { uuid: killedId },
      });
      ++game.playerStateChangeCounter;
      broadcastGameState();
      respawnedP.then(() => {
        ++game.playerStateChangeCounter;
        broadcastGameState();
      });
    });
  } else if (type === KingToServerMessage.GET_GAMES) {
    const games = Object.values(gamesById);
    emit(
      {
        type: "ALL_GAMES",
        payload: games.map((game) => {
          game.gameFull;
          return {
            id: game.id,
            name: game.name,
            players: { count: game.players.length, max: game.maxNumPlayers },
          };
        }),
      },
      ws,
    );
  } else if (type === KingToServerMessage.JOIN_GAME) {
    const game = gamesById[payload.id];
    if (game) {
      const { ok, value } = game.registerPlayer(ws);
      if (ok) {
        const player = value;
        playerAndGameBySocket.set(ws, [player, game]);
        log.debug(`created player`, player);
        emit(
          {
            type: "JOIN_GAME_RESULT",
            payload: { ok: true },
          },
          ws,
        );
      } else {
        emit(
          {
            type: "JOIN_GAME_RESULT",
            payload: { ok: false, error: value.message },
          },
          ws,
        );
      }
    } else {
      emit(
        {
          type: "JOIN_GAME_RESULT",
          payload: { ok: false, error: `game ${payload.id} not found` },
        },
        ws,
      );
    }
  } else if (type === KingToServerMessage.REQUEST_PLAYERS) {
    throw new Error("not implemented");
  } else {
    const msg = nevMessage(type, `UNSUPPORTED MESSAGE: ${raw}`);
    throw new Error();
  }
}

// socket utils
export const emit = (msg: ToClient, ws: WebSocket) => {
  log.info(msg.type);
  ws.send(JSON.stringify(msg));
};
export const broadcast = (
  game: Game,
  data: ToClient,
  omitSocket: WebSocket | null = null,
) => {
  // log.debug(Object.keys(game.state.playerStateByUuid).join(", "));
  const sent: Promise<void>[] = Array.from(wss.clients).map((ws) => {
    if (omitSocket && ws === omitSocket) return Promise.resolve();
    const res = playerAndGameBySocket.get(ws);
    if (!res || res[1] !== game) return Promise.resolve();
    return new Promise((resolve, reject) => {
      ws.send(JSON.stringify(data), (err) => (err ? reject(err) : resolve()));
    });
  });
  return Promise.allSettled(sent);
};

export const broadcastDebounced = debounce(broadcast, 50, {
  // leading: true,
  maxWait: 50,
});
["SIGINT" as const, "SIGHUP" as const].forEach((signal) => {
  process.on(signal, async () => {
    for (let game of Object.values(gamesById)) {
      log.info(`shutting down. broadcasting KingServerMessage.TEARDOWN`);
      try {
        await broadcast(game, {
          type: "TEARDOWN",
          payload: null,
        });
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
      wss.close((err) => {
        if (err) throw err;
        process.exit(signal === "SIGHUP" ? 0 : 1);
      });
    }
  });
});
