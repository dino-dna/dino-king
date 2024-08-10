import http from "node:http";
import { Room, Client } from "colyseus";
import { Game, GameOptions } from "./game";

export class DinoRoom extends Room<Game> {
  // (optional) Validate client auth token before joining/creating the room
  // static async onAuth(token: string, request: http.IncomingMessage) {}

  // When room is initialized
  // Create an onCreate method with a param that should have type of Game's constructor params
  onCreate(options: GameOptions) {
    this.setState(new Game(options));
  }

  // When client successfully join the room
  onJoin(client: Client, options: any, auth: any) {
    this.this.state.addPlayer(client.sessionId);
  }

  // When a client leaves the room
  onLeave(client: Client, consented: boolean) {}

  // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
  onDispose() {}
}
