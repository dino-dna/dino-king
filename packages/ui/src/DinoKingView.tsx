import "./DinoKingView.css";
import * as React from "react";
import { DinoKing } from "./game/index";
import { GameMessages, GameState } from "./interfaces";
import cx from "classnames";
import Banner from "./componentlib/Banner";
import Nanobus from "nanobus";

export interface IAppState {
  gameState: GameState;
}

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export const DinoKingView: React.FC<{
  gameId: number;
  onExit?: () => void;
}> = ({ gameId, onExit }) => {
  const [bus] = React.useState(new Nanobus());
  (window as any).bus = bus;

  const [gameContainer, setGameContainer] =
    React.useState<HTMLDivElement | null>(null);
  const [state, setState] = React.useState<GameState>({
    error: false,
    type: "Starting",
  });

  const [game, setGame] = React.useState<DinoKing | null>(null);
  React.useEffect(() => {
    bus.on(GameMessages.SocketError, () => {
      setState({ error: true, type: "SocketError" });
    });
    bus.on(GameMessages.GameShutdown, () => {
      setState({ error: false, type: "Stopped" });
    });
    const game = new DinoKing({ gameId });
    setGame(game);
    (window as any).game = game;
  }, []);
  const { type, error } = state;
  const isGameRunning = !error && type !== "Stopped";
  const gameStateClassNames = cx("game-state__pane", {
    "game-state__pane--visible": isGameRunning,
  });
  let banner: React.ReactNode | null = null;
  let gameNode: React.ReactNode | null = null;
  let greatSuff: React.ReactNode | null = null;

  switch (type) {
    case "Running":
    case "Starting":
      gameNode = <div id="game" ref={setGameContainer} />;
      break;
    case "SocketError":
      banner = <Banner type="error" children={type} />;
      break;
    case "Stopped":
      onExit?.();
      break;
    default:
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html
      // see exhaustive checking
      return assertNever(type);
  }
  const appClassnames = cx("DinoKingView", {
    "DinoKingView--error": !!error,
    "DinoKingView--running": isGameRunning,
  });
  return (
    <div className={appClassnames}>
      {banner}
      {isGameRunning && gameNode}
      {greatSuff}
      <pre id="game_state" className={gameStateClassNames} />
    </div>
  );
};

export default DinoKingView;
