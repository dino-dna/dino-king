import React from "react";
import GameItem, { GameItemProps } from "./GameListItem";
import { GameListEntry } from "common";

interface GameListProps {
  games: GameListEntry[];
  onSelect: GameItemProps["onSelect"];
}

const GameList: React.FC<GameListProps> = ({ games, onSelect }) => {
  return (
    <ul>
      {games.map((game) => (
        <GameItem key={game.id} game={game} onSelect={onSelect} />
      ))}
    </ul>
  );
};

export default GameList;
