export type TeamColor = "blue" | "orange";
import WebSocket from "ws";
import { GameListEntry } from "./models/game";

export * from "./models/game";
export * from "./ts/util";

export type CentralGameState = {
  playerStateByUuid: PlayerStateByUuid;
  playerStateChangeCounter: number;
  serverTime: number;
};

export type CharacterType = "king" | "knight" | "peon";

export type PlayerBodyState = {
  acceleration: { x: number; y: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  currentAnimationName: string;
};

export type PlayerStateByUuid = {
  [uuid: number]: PlayerState;
};

export type PlayerState = {
  characterType: CharacterType;
  gameId: number;
  isAlive: boolean;
  lastUpdateTime?: number;
  playerBodyState: PlayerBodyState;
  teamId: TeamColor;
  teamPlayerId: number;
  uuid: number;
  socket: WebSocket;
};

export enum KingToServerMessage {
  KILL_PLAYER = "KILL_PLAYER",
  NEW_GAME = "NEW_GAME",
  REQUEST_CHARACTER = "REQUEST_CHARACTER",
  REQUEST_PLAYERS = "REQUEST_PLAYERS",
  PLAYER_BODY_STATE = "PLAYER_BODY_STATE",
  GET_GAMES = "GET_GAMES",
  JOIN_GAME = "JOIN_GAME",
}

export type Msg<Id, Payload> = { type: Id; payload: Payload };

export type ToServer =
  | Msg<KingToServerMessage.KILL_PLAYER, { killedId: number }>
  | Msg<KingToServerMessage.NEW_GAME, null>
  | Msg<KingToServerMessage.REQUEST_CHARACTER, { gameId: number }>
  | Msg<KingToServerMessage.REQUEST_PLAYERS, null>
  | Msg<KingToServerMessage.PLAYER_BODY_STATE, PlayerBodyState>
  | Msg<KingToServerMessage.GET_GAMES, null>
  | Msg<KingToServerMessage.JOIN_GAME, { id: number }>;

export type KingToClientMessage =
  | "JOIN_GAME_RESULT"
  | "ALL_GAMES"
  | "ASSIGN_CHARACTER"
  | "HANDLE_NEW_PLAYER"
  | "HANDLE_PLAYER_DISCONECTED"
  | "KILL_PLAYER"
  | "PLAYER_REGISTRATION"
  | "SERVER_PLAYERS"
  | "TEARDOWN"
  | "UPDATE_GAME_STATE"
  | "UPDATE_PLAYER_STATE";

export type ToClient =
  | Msg<"JOIN_GAME_RESULT", { ok: boolean; error?: string }>
  | Msg<"ALL_GAMES", GameListEntry[]>
  | Msg<"ASSIGN_CHARACTER", number | { error: string }>
  | Msg<"HANDLE_NEW_PLAYER", PlayerState>
  | Msg<"HANDLE_PLAYER_DISCONNECTED", PlayerState>
  | Msg<"KILL_PLAYER", { uuid: number }>
  | Msg<"PLAYER_REGISTRATIONS", PlayerState[]>
  | Msg<"SERVER_PLAYERS", PlayerState[]>
  | Msg<"TEARDOWN", null>
  | Msg<"UPDATE_GAME_STATE", CentralGameState>
  | Msg<"UPDATE_PLAYER_STATE", PlayerState>;

export const DEATH_ANIMATION_DURATION = 3000;
