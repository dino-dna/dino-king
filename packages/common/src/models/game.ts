export interface GameListEntry {
  id: number;
  name: string;
  players: { count: number; max: number };
}
