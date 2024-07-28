export type TeamColor = "blue" | "orange";

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
};

export enum KingToServerMessage {
  KILL_PLAYER = "KILL_PLAYER",
  NEW_GAME = "NEW_GAME",
  REQUEST_CHARACTER = "REQUEST_CHARACTER",
  REQUEST_PLAYERS = "REQUEST_PLAYERS",
  PLAYER_BODY_STATE = "PLAYER_BODY_STATE",
}

export type Msg<Id, Payload> = { type: Id; payload: Payload };

export type ToServer =
  | Msg<KingToServerMessage.KILL_PLAYER, number>
  | Msg<KingToServerMessage.NEW_GAME, null>
  | Msg<KingToServerMessage.REQUEST_CHARACTER, null>
  | Msg<KingToServerMessage.REQUEST_PLAYERS, null>
  | Msg<KingToServerMessage.PLAYER_BODY_STATE, PlayerBodyState>;

export enum KingToClientMessage {
  ASSIGN_CHARACTER = "ASSIGN_CHARACTER",
  HANDLE_NEW_PLAYER = "HANDLE_NEW_PLAYER",
  HANDLE_PLAYER_DISCONNECTED = "HANDLE_PLAYER_DISCONNECTED",
  KILL_PLAYER = "KILL_PLAYER",
  PLAYER_REGISTRATIONS = "PLAYER_REGISTRATIONS",
  SERVER_PLAYERS = "SERVER_PLAYERS",
  TEARDOWN = "TEARDOWN",
  UPDATE_GAME_STATE = "UPDATE_GAME_STATE",
  UPDATE_PLAYER_STATE = "UPDATE_PLAYER_STATE",
}

export type ToClient =
  | Msg<KingToClientMessage.ASSIGN_CHARACTER, number>
  | Msg<KingToClientMessage.HANDLE_NEW_PLAYER, PlayerState>
  | Msg<KingToClientMessage.HANDLE_PLAYER_DISCONNECTED, PlayerState>
  | Msg<KingToClientMessage.KILL_PLAYER, { uuid: number }>
  | Msg<KingToClientMessage.PLAYER_REGISTRATIONS, PlayerState[]>
  | Msg<KingToClientMessage.SERVER_PLAYERS, PlayerState[]>
  | Msg<KingToClientMessage.TEARDOWN, null>
  | Msg<KingToClientMessage.UPDATE_GAME_STATE, CentralGameState>
  | Msg<KingToClientMessage.UPDATE_PLAYER_STATE, PlayerState>;

export const DEATH_ANIMATION_DURATION = 3000;
