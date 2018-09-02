import { Character } from '../Character'
import {
  KingClientMessage,
  KingServerMessage,
  PlayerRegistration,
  CentralGameState
} from 'common'

export const TARGET_WIDTH = 1792
export const TARGET_HEIGTH = 1008

export type BodyStateTuple = [number, number, number, number, number, number]

export class GameScene extends Phaser.Scene {
  private characterGroup: Phaser.GameObjects.Group
  private bg: Phaser.Tilemaps.StaticTilemapLayer
  private bg_decor: Phaser.Tilemaps.StaticTilemapLayer
  private platforms: Phaser.Tilemaps.StaticTilemapLayer
  private tilesetLayers: Phaser.Tilemaps.StaticTilemapLayer[]

  public charactersById: Map<number, Character>
  public lastUpdatePlayerBodyState: BodyStateTuple
  public player: Character
  public track: Phaser.Sound.BaseSound
  public ws: WebSocket

  constructor () {
    super({
      key: 'GameScene'
    })
    this.charactersById = new Map()
    this.lastUpdatePlayerBodyState = [-1, -1, -1, -1, -1, -1]
  }

  preload () {
    this.load
      .pack('preload', './pack.json', 'preload')
      .tilemapTiledJSON('map', 'map.json')
      .multiatlas('king', 'king.json', 'assets')
  }

  postCreate () {
    this.ws = new WebSocket(`ws://${location.host}/api`)
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
      // console.log(type)
      if (type === KingServerMessage.ASSIGN_CHARACTER) {
        this.createPlayer({ player: payload, currentUser: true })
      } else if (type === KingServerMessage.HANDLE_PLAYER_DISCONNECTED) {
        this.removePlayer(payload)
      } else if (type === KingServerMessage.HANDLE_NEW_PLAYER) {
        this.createPlayer({ player: payload })
      } else if (type === KingServerMessage.UPDATE_GAME_STATE) {
        // console.log(
        //   JSON.stringify(
        //     Object['values'](payload.playerStateById).map(z =>
        //       Object['values'](z.playerBodyState.position)
        //     )
        //   )
        // )
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
      texture: player.characterConfig.type,
      frame: 'idle/1',
      characterType: player.characterConfig.type
    })
    if (player.characterConfig.team === 'blue') {
      character.setTint(0xaaaaff, 0xffffff, 0x2222ff, 0x2222ff)
    } else {
      character.setTint(0xff0000, 0xffffff, 0xffbb00, 0xffbbff)
    }
    this.characterGroup.add(character)
    character.body.setCollideWorldBounds(true)
    this.tilesetLayers.forEach(layer =>
      this.physics.add.collider(character, layer)
    )
    this.physics.add.collider(
      character,
      this.characterGroup,
      this.onPlayersCollide.bind(this)
    )
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
    this.track = this.sound.add('1')
    this.track.play()
    this.cameras.main.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    this.physics.world.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('tileset', 'tileset')
    this.bg = map.createStaticLayer('bg', tileset, 0, 0)
    this.bg_decor = map.createStaticLayer('bg_decor', tileset, 0, 0)
    this.platforms = map.createStaticLayer('platforms', tileset, 0, 0)
    this.tilesetLayers = [this.bg, this.bg_decor, this.platforms]
    this.tilesetLayers.forEach(layer => {
      // const debugGraphics = this.add.graphics().setAlpha(0.75)
      // layer.renderDebug(debugGraphics, {
      //   tileColor: null, // Color of non-colliding tiles
      //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      // })
      layer.setCollisionByProperty({ collides: true })
    })
    this.cameras.main.setBackgroundColor('rgb(130, 240, 255)') // ){ r: 120, g: 120, b: 255, a: 0.5 })
    this.characterGroup = this.physics.add.group()
    this.postCreate()
  }

  onPlayersCollide (
    player1Object: Phaser.GameObjects.GameObject,
    player2Object: Phaser.GameObjects.GameObject
  ) {
    const player1Body = player1Object.body as Phaser.Physics.Arcade.Body
    const player2Body = player2Object.body as Phaser.Physics.Arcade.Body
    const topPlayerBody =
      player1Body.y < player2Body.y ? player1Body : player2Body
    const bottomPlayerBody =
      topPlayerBody === player1Body ? player2Body : player1Body
    const topPlayerBottomY = topPlayerBody.y + topPlayerBody.halfHeight
    const bottomPlayerTopY = bottomPlayerBody.y - bottomPlayerBody.halfHeight
    console.log(topPlayerBottomY, bottomPlayerTopY)
    // @TODO improve kill conditions!
    if (topPlayerBottomY <= bottomPlayerTopY) {
      const currentCharacters = Array.from(this.charactersById.entries())
      const [topId, topCharacter] = currentCharacters.find(
        ([_, character]) => character.body === topPlayerBody
      )
      const [bottomId, bottomCharacter] = currentCharacters.find(
        ([_, character]) => character.body === bottomPlayerBody
      )
      this.ws.send(
        JSON.stringify({
          type: KingClientMessage.KILL_PLAYER,
          payload: {
            killed: bottomId,
            killedBy: topId
          }
        })
      )
    }
  }

  update () {
    if (!this.track.isPlaying) this.track.play()
    if (this.player && this.player.body) {
      this.player.update()
      const currentUserBodyState: BodyStateTuple = [
        this.player.body.position.x,
        this.player.body.position.y,
        this.player.body.velocity.x,
        this.player.body.velocity.y,
        this.player.body.acceleration.x,
        this.player.body.acceleration.y
      ]
      const isStateMatching = currentUserBodyState.every(
        (v, i) => v === this.lastUpdatePlayerBodyState[i]
      )
      if (!isStateMatching) {
        this.lastUpdatePlayerBodyState = currentUserBodyState
        this.sendPlayerState()
      }
    }
  }

  updateRemoteControlledGameState (state: CentralGameState) {
    for (let [id, character] of this.charactersById.entries()) {
      let playerState = state.playerStateById[id]
      if (!playerState) return character.destroy()
      if (this.player === character) {
        // pass. whatever.  cheat it up, bro
        // if (this.player.body.position.distance(playerState.position) < 100)
      } else {
        // console.log(playerState.position.x, playerState.position.y)
        character.setPosition(
          playerState.playerBodyState.position.x + character.body.halfWidth,
          playerState.playerBodyState.position.y + character.body.halfHeight // IDFK
        )
        character.body.setAcceleration(
          playerState.playerBodyState.acceleration.x,
          playerState.playerBodyState.acceleration.x
        )
        character.body.setVelocity(
          playerState.playerBodyState.velocity.x,
          playerState.playerBodyState.velocity.x
        )
      }
    }
  }

  removePlayer (player: any) {
    // @TODO remove player
  }

  sendPlayerState () {
    this.ws.send(
      JSON.stringify({
        type: KingClientMessage.PLAYER_BODY_STATE,
        payload: {
          position: this.player.body.position,
          velocity: this.player.body.velocity,
          acceleration: this.player.body.acceleration
        }
      })
    )
  }
}
