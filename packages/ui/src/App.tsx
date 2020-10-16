import "./App.css";
import * as React from "react";
import { MurderKing, config as gameConfig } from "./game/index";
import { GameMessages, GameState } from "./interfaces";
import cx from "classnames";
import { Banner } from "Banner";

type Nanobus = <Msg>() => {
  on: (msg: Msg, cb: () => void) => void;
};
const nanobus: Nanobus = require("nanobus");

export interface IAppState {
  gameState: GameState;
}

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export const App: React.FC<IAppState> = (props) => {
  const [bus] = React.useState(nanobus());
  const [gameContainer, setGameContainer] = React.useState<HTMLDivElement | null>(null);
  const [state, setState] = React.useState<GameState>({ error: false, type: "Starting" });
  const [game, setGame] = React.useState<MurderKing | null>(null);
  React.useEffect(() => {
    bus.on(GameMessages.SocketError, () => {
      setState({ error: true, type: "SocketError" });
    });
    bus.on(GameMessages.GameShutdown, () => {
      setState({ error: false, type: "Stopped" });
    });
    const game = new MurderKing(gameConfig);
    setGame(game);
    (window as any).game = game;
  }, []);
  const { type, error } = state;
  const isGameRunning = !error && type !== "Stopped";
  const gameStateClassNames = cx("game-state__pane", {
    "game-state__pane--visible": isGameRunning,
  });
  let banner;
  let gameNode;
  let greatSuff;
  switch (type) {
    case "Running":
    case "Starting":
      gameNode = <div id="game" ref={setGameContainer} />;
      break;
    case "SocketError":
      banner = <Banner children={type} />;
      break;
    case "Stopped":
      greatSuff = <p>Sup dawgs! Join a game</p>;
      break;
    default:
      // https://www.typescriptlang.org/docs/handbook/advanced-types.html
      // see exhaustive checking
      return assertNever(type);
  }
  const appClassnames = cx("App", {
    "App--error": !!error,
    "App--running": isGameRunning,
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
