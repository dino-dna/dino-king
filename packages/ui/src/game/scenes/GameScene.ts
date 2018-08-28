import { Character } from '../Character'
import {
  KingClientMessage,
  KingServerMessage,
  PlayerRegistration,
  CentralGameState
} from 'common'

export const TARGET_WIDTH = 1920
export const TARGET_HEIGTH = 1020

export class GameScene extends Phaser.Scene {
  // // objects
  // private bird: Bird;
  private characterGroup: Phaser.GameObjects.Group
  private bg: Phaser.Tilemaps.StaticTilemapLayer
  private platforms: Phaser.Tilemaps.StaticTilemapLayer

  public player: Character
  public charactersById: Map<number, Character>
  public ws: WebSocket

  constructor () {
    super({
      key: 'GameScene'
    })
    this.charactersById = new Map()
  }

  preload () {
    this.load
      .pack('preload', './pack.json', 'preload')
      .tilemapTiledJSON('map', 'assets/murder-king.json')
      .image('bg', 'assets/images/bg.png')
  }

  postCreate () {
    this.ws = new WebSocket('ws://localhost:9999')
    const ws = this.ws
    ws.addEventListener('open', function open () {
      ws.send(
        JSON.stringify({
          type: KingClientMessage.REQUEST_PLAYERS,
          payload: null
        })
      )
      ws.send(
        JSON.stringify({
          type: KingClientMessage.REQUEST_CHARACTER,
          payload: {
            team: { auto: true } // @TODO support team color selection
          }
        })
      )
    })

    ws.addEventListener('message', ({ data }) => {
      const { type, payload } = JSON.parse(data)
      if (type === KingServerMessage.ASSIGN_CHARACTER) {
        this.createPlayer({ player: payload, currentUser: true })
      } else if (type === KingServerMessage.HANDLE_PLAYER_DISCONNECTED) {
        this.removePlayer(payload)
      } else if (type === KingServerMessage.HANDLE_NEW_PLAYER) {
        this.createPlayer({ player: payload })
      } else if (type === KingServerMessage.UPDATE_GAME_STATE) {
        this.updateRemoteControlledGameState(payload)
      } else if (type === KingServerMessage.PLAYER_REGISTRATIONS) {
        this.configurePlayers(payload)
      } else {
        throw new Error(
          `unsupported message type: ${type || 'MESSAGE_TYPE_MISSING'}`
        )
      }
    })
  }

  configurePlayers (players: PlayerRegistration[]) {
    const playersById = players.reduce(
      // e.g. `keyBy`
      (agg, p) => ({ ...{ [p.id]: p }, ...agg }),
      {}
    )
    const remoteIds: Set<number> = new Set(players.map(player => player.id))
    const localIds = new Set(this.charactersById.keys())
    const toAdd = new Set([...remoteIds].filter(x => !localIds.has(x)))
    const toRemove = new Set([...localIds].filter(x => !remoteIds.has(x)))
    let id: number
    for (id of toAdd.values()) {
      this.createPlayer({ player: playersById[id] })
    }
    for (id of toRemove.values()) {
      this.removePlayer(this.charactersById.get(id)!)
    }
  }

  createPlayer (opts: { player: PlayerRegistration; currentUser?: boolean }) {
    const { player, currentUser } = opts
    if (currentUser && this.player) {
      return console.log('player already exists, skipping')
    }
    const character = new Character({
      scene: this,
      x: 100,
      y: 450,
      texture: `${player.characterConfig.type}_${player.characterConfig.team}/1`
    })
    this.characterGroup.add(character)
    character.body.setCollideWorldBounds(true)
    this.physics.add.collider(character, this.platforms)
    this.physics.add.collider(character, this.characterGroup)
    if (currentUser) {
      this.player = character
      this.cameras.main.startFollow(this.player, true, 0.05, 0.05)
    } else {
      // console.log('creating static character')
      // character.body.setImmovable(true)
      // character.body.setGravity(0, 0)
      // character.body.allowGravity = false
      // character.body.enable = false
    }
    this.charactersById.set(player.id, character)
  }

  create () {
    this.cameras.main.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    this.physics.world.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('bg', 'bg')
    this.bg = map.createStaticLayer('bg', tileset, 0, 0)
    this.platforms = map.createStaticLayer('platforms', tileset, 0, 0)
    this.platforms.setCollisionByProperty({ collides: true })
    this.characterGroup = this.physics.add.group()
    this.postCreate()
  }

  update () {
    if (this.player && this.player.body) {
      this.player.update()
      if (this.player.body.velocity.x || this.player.body.velocity.y) {
        this.sendPlayerPosition()
      }
    }
  }

  updateRemoteControlledGameState (state: CentralGameState) {
    for (let [id, character] of this.charactersById.entries()) {
      let playerState = state.playerStateById[id]
      if (!playerState) {
        return character.destroy()
      }
      if (this.player === character) {
        // pass. whatever.  cheat it up, bro
        // if (this.player.body.position.distance(playerState.position) < 100)
      } else {
        // console.log(playerState.position.x, playerState.position.y)
        character.setPosition(playerState.position.x, playerState.position.y)
      }
    }
  }

  removePlayer (player: any) {
    // @TODO remove player
  }

  sendPlayerPosition () {
    this.ws.send(
      JSON.stringify({
        type: KingClientMessage.PLAYER_POSITION,
        payload: this.player.body.position
      })
    )
  }
}
