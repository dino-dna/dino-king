import React from "react";
import GameLobby from "./GameLobby";
import { Provider } from "./hooks/bus";
import { RootLayout } from "./componentlib/RootLayout";
const DinoKingView = React.lazy(() => import("./DinoKingView"));

export const App: React.FC = () => {
  const flags = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
  }, []);
  const [candidateGameId, setCandidateGameId] = React.useState<number | null>(
    null,
  );
  return (
    <Provider>
      {candidateGameId ? (
        <DinoKingView
          gameId={candidateGameId}
          onExit={() => {
            setCandidateGameId(null);
          }}
        />
      ) : (
        <RootLayout>
          <GameLobby
            onJoin={(id) => {
              setCandidateGameId(id);
            }}
          />
        </RootLayout>
      )}
    </Provider>
  );
};
