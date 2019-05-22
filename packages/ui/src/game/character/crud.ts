// import { CharacterUuid, CharactersByUuid } from '../../interfaces'
import { PlayerState } from 'common'
import { Character } from './Character'
import { TINTS } from '../pallette'
import { GameScene } from '../scenes/GameScene'

export interface CreatePlayerOpts {
  player: PlayerState
  scene: GameScene
}

export function create (opts: CreatePlayerOpts) {
  const { player, scene } = opts
  const spawnPoint = getSpawnPoint({ map: scene.map, player })
  const character = new Character({
    scene,
    x: (spawnPoint as any).x,
    y: (spawnPoint as any).y,
    texture: player.characterType,
    frame: 'idle/1',
    characterType: player.characterType
  })
  character.animate('idle')
  const characterTints = player.teamId === 'blue' ? TINTS.BLUE : TINTS.ORANGE
  character.setTint(...characterTints)
  return character
}

export interface GetSpawnPointConfig {
  map: GameScene['map']
  player: PlayerState
}
const getSpawnPoint = ({ map, player }: GetSpawnPointConfig) =>
  map.findObject(
    'spawns',
    obj => obj.name === `${player.teamId === 'blue' ? player.teamPlayerId : player.teamPlayerId + 5}`
  )
