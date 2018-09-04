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
  private map: Phaser.Tilemaps.Tilemap
  private platforms: Phaser.Tilemaps.StaticTilemapLayer
  private tilesetLayers: Phaser.Tilemaps.StaticTilemapLayer[]

  public charactersByUuid: Map<number, Character>
  public lastMessageEpochMs: number
  public lastUpdatePlayerBodyState: BodyStateTuple
  public msBetweenMessages: number
  public player: Character
  public track: Phaser.Sound.BaseSound
  public ws: WebSocket

  constructor () {
    super({
      key: 'GameScene'
    })
    this.lastMessageEpochMs = Date.now()
    this.msBetweenMessages = 50
    this.charactersByUuid = new Map()
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
    const gid = window.sessionStorage.getItem('gameId')
    const tid = window.sessionStorage.getItem('teamId')
    const uid = window.sessionStorage.getItem('userId')
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
            cached: {
              gid,
              tid,
              uid
            }
          }
        })
      )
    })
    const gameStateWidget = window.document.getElementById('game_state')!
    gameStateWidget.style.display = 'block'
    ws.addEventListener('message', ({ data }) => {
      const now = Date.now()
      this.msBetweenMessages = this.lastMessageEpochMs - now
      this.lastMessageEpochMs = now
      const { type, payload } = JSON.parse(data)
      if (type === KingServerMessage.ASSIGN_CHARACTER) {
        const { gid, tid, uid } = payload
        window.sessionStorage.setItem('gameId', gid)
        window.sessionStorage.setItem('teamId', tid)
        window.sessionStorage.setItem('userId', uid)
        this.createPlayer({ player: payload, currentUser: true })
      } else if (type === KingServerMessage.HANDLE_PLAYER_DISCONNECTED) {
        this.removePlayer(payload)
      } else if (type === KingServerMessage.HANDLE_NEW_PLAYER) {
        this.createPlayer({ player: payload })
      } else if (type === KingServerMessage.UPDATE_GAME_STATE) {
        const debugState = {}
        for (let playerUuid in payload.playerStateByUuid) {
          let body = payload.playerStateByUuid[playerUuid].playerBodyState
          debugState[playerUuid] = {
            position: Object['values'](body.position)
              .map(i => i.toFixed(0))
              .join(','),
            velocity: Object['values'](body.velocity)
              .map(i => i.toFixed(0))
              .join(',')
          }
        }
        gameStateWidget.textContent = JSON.stringify(debugState, null, 2)
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
    const playersByUuid = players.reduce(
      // e.g. `keyBy`
      (agg, p) => ({ ...{ [p.uuid]: p }, ...agg }),
      {}
    )
    const remoteIds: Set<number> = new Set(players.map(player => player.uuid))
    const localIds = new Set(this.charactersByUuid.keys())
    const toAdd = new Set([...remoteIds].filter(x => !localIds.has(x)))
    const toRemove = new Set([...localIds].filter(x => !remoteIds.has(x)))
    let uuid: number
    for (uuid of toAdd.values()) {
      this.createPlayer({ player: playersByUuid[uuid] })
    }
    for (uuid of toRemove.values()) {
      this.removePlayer(this.charactersByUuid.get(uuid)!)
    }
  }

  createPlayer (opts: { player: PlayerRegistration; currentUser?: boolean }) {
    const { player, currentUser } = opts
    if (currentUser && this.player) {
      return console.log('player already exists, skipping')
    }
    const spawnPoint = this.map.findObject(
      'spawns',
      obj =>
        obj.name === `${player.tid === 'blue' ? player.uid : player.uid + 5}`
    )
    const character = new Character({
      scene: this,
      x: (spawnPoint as any).x,
      y: (spawnPoint as any).y,
      texture: player.characterType,
      frame: 'idle/1',
      characterType: player.characterType
    })
    if (player.tid === 'blue') {
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
    this.charactersByUuid.set(player.uuid, character)
  }

  create () {
    this.track = this.sound.add('1')
    this.track.play()
    Character.createKingAnimations(this)
    this.cameras.main.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    this.physics.world.setBounds(0, 0, TARGET_WIDTH, TARGET_HEIGTH)
    const map = this.make.tilemap({ key: 'map' })
    this.map = map
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
      const currentCharacters = Array.from(this.charactersByUuid.entries())
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
    for (let [uuid, character] of this.charactersByUuid.entries()) {
      let playerState = state.playerStateByUuid[uuid]
      if (!playerState) return character.destroy()
      if (this.player === character) {
        // weee
      } else {
        let vx = playerState.playerBodyState.velocity.x
        // if things are running fast, just move the character
        if (this.msBetweenMessages < 25) {
          character.setPosition(
            playerState.playerBodyState.position.x + character.body.width,
            playerState.playerBodyState.position.y + character.body.halfHeight // IDFK
          )
        } else {
          // otherwise, tween 'em over
          character.tween && character.tween.isPlaying && character.tween.stop()
          character.tween = this.add.tween({
            targets: character,
            x:
              playerState.playerBodyState.position.x + character.body.halfWidth,
            y:
              playerState.playerBodyState.position.y +
              character.body.halfHeight,
            delay: this.msBetweenMessages * 0.75
          })
        }
        character.body.setAcceleration(
          playerState.playerBodyState.acceleration.x,
          playerState.playerBodyState.acceleration.y
        )
        character.body.setVelocity(
          playerState.playerBodyState.velocity.x,
          playerState.playerBodyState.velocity.y
        )
        character.animate(playerState.playerBodyState.currentAnimationName)
        if (vx < -5 || vx > 5) {
          character.flipX = playerState.playerBodyState.velocity.x < 0
        }
      }
      // # labelSprite(uuid, character)
      // const style = {
      //   font: '12px Arial',
      //   fill: '#000',
      //   wordWrap: true,
      //   wordWrapWidth: character.width,
      //   align: 'center',
      //   backgroundColor: '#ffffff'
      // }
      // const text = this.add.text(0, 0, `${uuid}`, style)
      // text.x = Math.floor(character.x + character.width / 2)
      // text.y = Math.floor(character.y + character.height / 2)
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
          acceleration: this.player.body.acceleration,
          currentAnimationName: this.player.currentAnimationName
        }
      })
    )
  }
}
