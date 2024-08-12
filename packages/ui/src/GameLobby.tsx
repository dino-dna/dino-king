import React, { useState, useEffect, ChangeEvent } from "react";
import GameList from "./GameList";
import { useReceiveMsg, useReqRes, useSendMsg } from "./hooks/bus";
import { GameListEntry, KingToServerMessage } from "common";
import Spinner from "./componentlib/Spinner";
import Banner from "./componentlib/Banner";
import { Column, TextInput } from "@carbon/react";
import useLobbyChiptune from "./hooks/useLobbyChiptune";
import { Overlay } from "./componentlib/Overlay";

interface GameLobbyProps {
  onJoin: (gameId: number) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onJoin }) => {
  const [selectedGame, setSelectedGame] = useState<GameListEntry | null>(null);
  const [userName, setUserName] = useState("");

  const {
    isLoading: isLoadingGames,
    payload: games,
    error: gamesError,
  } = useReqRes(
    { type: KingToServerMessage.GET_GAMES, payload: null },
    "ALL_GAMES",
  );

  const {
    isLoading: isJoining,
    payload: joinedResult,
    error: joinGameError,
  } = useReqRes(
    {
      type: KingToServerMessage.JOIN_GAME,
      payload: { id: selectedGame?.id ?? -1 },
    },
    "JOIN_GAME_RESULT",
    {
      enabled: !!selectedGame,
    },
  );

  console.log({
    isJoining,
    isJoiningQueryEnabled: !!selectedGame,
    selectedGame,
    isLoadingGames,
    games,
    gamesError,
    joinedResult,
    joinGameError,
  });

  const joinOk = joinedResult?.ok;
  const selectedId = selectedGame?.id ?? -1;

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  useLobbyChiptune(!isOverlayVisible);

  React.useEffect(() => {
    const gameId = selectedId ?? -1;
    if (joinOk && gameId > 0) {
      onJoin(gameId);
    }
  }, [joinOk, selectedId]);

  const error = gamesError || joinGameError;

  const bannerContent = error ? (
    <Banner type="error">{error.message}</Banner>
  ) : isJoining ? (
    <Banner type="info">Preparing for battle</Banner>
  ) : null;
  return (
    <div id="lobby">
      {isOverlayVisible ? (
        <Overlay>
          <button
            type="button"
            className="play-button"
            onClick={() => setIsOverlayVisible(false)}
          >
            Play
          </button>
        </Overlay>
      ) : null}
      <div id="lobby_nav">
        <span className="game-title">
          <span className="dino">Dino</span>
          <span className="king">King</span>
        </span>
        <ul className="sub-nav">
          {["a", "b", "c"].map((it) => (
            <li key={it}>
              <a>{it}</a>
            </li>
          ))}
        </ul>
      </div>
      <div id="lobby_notification" className={bannerContent ? "on" : "off"}>
        {bannerContent}
      </div>
      <div id="lobby_left">
        {isLoadingGames ? (
          <Spinner />
        ) : games ? (
          // null
          <GameList
            games={games}
            onSelect={(game) => {
              setSelectedGame(game);
            }}
          />
        ) : null}
      </div>
      <div id="lobby_right">
        <TextInput
          id="username"
          onChange={(evt) => setUserName(evt.currentTarget.value)}
          type="text"
          labelText="User name"
          // helperText="Ingame name"
        />
      </div>
    </div>
  );
};

export default GameLobby;
