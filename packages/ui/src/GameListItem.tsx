import { GameListEntry } from "common";

export interface GameItemProps {
  game: GameListEntry;
  onSelect: (game: GameListEntry) => void;
}

const GameItem = ({ game, onSelect }: GameItemProps) => {
  const handleClick = () => {
    onSelect(game);
  };
  const isJoinable = game.players.count < game.players.max;
  return (
    <li>
      <span>{game.name}</span>
      <span>
        ({game.players.count}/{game.players.max})
      </span>
      <button disabled={!isJoinable} onClick={handleClick}>
        Join
      </button>
    </li>
  );
};

export default GameItem;
