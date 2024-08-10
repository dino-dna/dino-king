import React, { useState, useEffect, ChangeEvent } from "react";
import GameList from "./GameList";
import { useReceiveMsg, useReqRes, useSendMsg } from "./hooks/client";
import { GameListEntry, KingToServerMessage } from "common";
import Spinner from "./componentlib/Spinner";
import Banner from "./componentlib/Banner";
// import "./GameLobby.css";

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

  // console.log({
  //   isJoining,
  //   isJoiningQueryEnabled: !!selectedGame,
  //   selectedGame,
  //   isLoadingGames,
  //   games,
  //   gamesError,
  //   joinedResult,
  //   joinGameError,
  // });

  const joinOk = joinedResult?.ok;
  const selectedId = selectedGame?.id ?? -1;

  React.useEffect(() => {
    const gameId = selectedId ?? -1;
    if (joinOk && gameId > 0) {
      onJoin(gameId);
    }
  }, [joinOk, selectedId]);

  const error = gamesError || joinGameError;

  return (
    <div className="lobby-container">
      {error ? (
        <Banner type="error">{error.message}</Banner>
      ) : isJoining ? (
        <Banner type="info">Preparing for battle</Banner>
      ) : null}
      <input
        type="text"
        value={userName}
        onChange={(evt) => setUserName(evt.currentTarget.value)}
        placeholder="Enter your name"
      />
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
  );
};

export default GameLobby;
