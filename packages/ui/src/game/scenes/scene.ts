import { GameScene, BodyStateTuple } from "./GameScene";

export function update(scene: GameScene) {
  const { physics, track, currentPlayer } = scene;
  if (track && !track.isPlaying) track.play();
  if (currentPlayer && currentPlayer.body) {
    currentPlayer.update();
    physics.world.wrap(currentPlayer, -20);

    const currentPlayerBodyState: BodyStateTuple = [
      currentPlayer.body.position.x,
      currentPlayer.body.position.y,
      currentPlayer.body.velocity.x,
      currentPlayer.body.velocity.y,
      currentPlayer.body.acceleration.x,
      currentPlayer.body.acceleration.y,
    ];
    const isCurrentPlayerBodyStateChanged = currentPlayerBodyState.every(
      (v, i) => v === scene.lastUpdatePlayerBodyState[i]
    );
    if (!isCurrentPlayerBodyStateChanged) {
      scene.lastUpdatePlayerBodyState = currentPlayerBodyState;
      scene.sendPlayerState();
    }
  }
}
