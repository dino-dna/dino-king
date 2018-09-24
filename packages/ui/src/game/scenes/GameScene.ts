import { Character } from '../Character'
import { KingClientMessage, KingServerMessage, CentralGameState, PlayerStateByUuid, PlayerState } from 'common'
import { TINTS } from '../pallette'
import { EventEmitter } from 'events'
import { GameMessages } from '../../interfaces'

export const TARGET_WIDTH = 1792
export const TARGET_HEIGTH = 1008

export type BodyStateTuple = [number, number, number, number, number, number]

export interface IEventLogState {
  group: string | null
  lastEventType: string
}

export class GameScene extends Phaser.Scene {
  private characterGroup: Phaser.GameObjects.Group
  private bg: Phaser.Tilemaps.StaticTilemapLayer
  private bg_decor: Phaser.Tilemaps.StaticTilemapLayer
  private map: Phaser.Tilemaps.Tilemap
  private platforms: Phaser.Tilemaps.StaticTilemapLayer
  private tilesetLayers: Phaser.Tilemaps.StaticTilemapLayer[]
  private eventLogState: IEventLogState

  public centralState: CentralGameState
  public charactersByUuid: Map<number, Character>
  public lastMessageEpochMs: number
  public lastUpdatePlayerBodyState: BodyStateTuple
  public msBetweenMessages: number
  public player: Character
  public track: Phaser.Sound.BaseSound
  public ws: WebSocket
  public bus: EventEmitter
  public uuid: number

  constructor () {
    super({
      key: 'GameScene'
    })
    this.lastMessageEpochMs = Date.now()
    this.msBetweenMessages = 50
    this.charactersByUuid = new Map()
    this.lastUpdatePlayerBodyState = [-1, -1, -1, -1, -1, -1]
    this.eventLogState = {
      group: null,
      lastEventType: ''
    }
    this.bus = (window as any).bus
    if (!this.bus) throw new Error('game message bus not found')
  }

  listen () {
    this.ws = new WebSocket(`ws://${location.host}/api`)
    const ws = this.ws
    const gid = window.sessionStorage.getItem('gameId')
    const tid = window.sessionStorage.getItem('teamId')
    const uid = window.sessionStorage.getItem('userId')
    ws.addEventListener('open', function open () {
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
    ws.addEventListener('error', (evt: Event) => {
      this.bus.emit(GameMessages.SocketError)
    })
    ws.addEventListener('message', ({ data }) => {
      this.onMessage(data)
    })
  }

  private logEvent (type: KingServerMessage, payload: any) {
    if (
      type === KingServerMessage.UPDATE_GAME_STATE &&
      this.eventLogState.lastEventType === KingServerMessage.UPDATE_GAME_STATE
    ) {
      return
    }
    console.groupCollapsed(type)
    console.log(payload)
    console.groupEnd()
    this.eventLogState.lastEventType = type
  }

  preload () {
    this.load
      .pack('preload', './pack.json', 'preload')
      .tilemapTiledJSON('map', 'map.json')
      .multiatlas('king', 'characters/king.json', 'characters')
      .multiatlas('knight', 'characters/knight.json', 'characters')
      .multiatlas('peon', 'characters/peon.json', 'characters')
  }

  configurePlayers (playersByUuid: PlayerStateByUuid) {
    const remoteIds: Set<number> = new Set(Object.keys(playersByUuid).map(i => parseInt(i)))
    const localIds: Set<number> = new Set(this.charactersByUuid.keys())
    const toAdd = new Set([...remoteIds].filter(x => !localIds.has(x)))
    const toRemove = new Set([...localIds].filter(x => !remoteIds.has(x)))
    let uuid: number
    for (uuid of toAdd.values()) {
      this.createPlayer(playersByUuid[uuid])
    }
    for (uuid of toRemove.values()) this.removePlayer(uuid)
  }

  create () {
    this.track = this.sound.add('1')
    this.track.play()
    Character.createAnimations(this)
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
    this.listen()
  }

  createPlayer (player: PlayerState) {
    const isCurrentPlayer = player.uuid === this.uuid
    const existingPlayer = this.charactersByUuid.get(player.uuid)
    if (existingPlayer) {
      return console.log(`player uuid: ${player.uuid} exists, skipping`)
    }
    const spawnPoint = this.map.findObject(
      'spawns',
      obj => obj.name === `${player.teamId === 'blue' ? player.teamPlayerId : player.teamPlayerId + 5}`
    )
    const character = new Character({
      scene: this,
      x: (spawnPoint as any).x,
      y: (spawnPoint as any).y,
      texture: player.characterType,
      frame: 'idle/1',
      characterType: player.characterType
    })
    character.body.setImmovable(!isCurrentPlayer)
    character.animate('idle')
    const characterTints = player.teamId === 'blue' ? TINTS.BLUE : TINTS.ORANGE
    character.setTint(...characterTints)
    this.characterGroup.add(character)
    character.body.setCollideWorldBounds(true)
    this.tilesetLayers.forEach(layer => this.physics.add.collider(character, layer))
    this.physics.add.collider(character, this.characterGroup, this.onPlayersCollide.bind(this))
    if (isCurrentPlayer) {
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
    console.log(`created player [current player: ${isCurrentPlayer}]: ${player.uuid}`)
  }

  killPlayer (uuid: number) {
    const character = this.charactersByUuid.get(uuid)
    if (!character) return
    character.animate('dead')
    // @TODO prevent player from being interacted with.  essentially turn the Sprite into
    // animation only--remove all physics and interactivity from it!
    character.destroy()
    this.charactersByUuid.delete(uuid)
  }

  onMessage (data: any) {
    const now = Date.now()
    this.msBetweenMessages = this.lastMessageEpochMs - now
    this.lastMessageEpochMs = now
    const { type, payload } = JSON.parse(data)
    this.logEvent(type, payload)
    switch (type) {
      case KingServerMessage.ASSIGN_CHARACTER:
        this.uuid = payload
        break
      case KingServerMessage.HANDLE_PLAYER_DISCONNECTED:
        this.removePlayer(payload)
        break
      case KingServerMessage.KILL_PLAYER:
        this.killPlayer(payload.uuid)
        break
      case KingServerMessage.UPDATE_GAME_STATE:
        this.updateDebugWidget(payload)
        this.updateRemoteControlledGameState(payload)
        break
      case KingServerMessage.TEARDOWN:
        this.bus.emit(GameMessages.GameShutdown)
        break
      default:
        throw new Error(`unsupported message type: ${type || 'MESSAGE_TYPE_MISSING'}`)
    }
  }

  onPlayersCollide (player1Object: Phaser.GameObjects.GameObject, player2Object: Phaser.GameObjects.GameObject) {
    const player1Body = player1Object.body as Phaser.Physics.Arcade.Body
    const player2Body = player2Object.body as Phaser.Physics.Arcade.Body
    const topPlayerBody = player1Body.y < player2Body.y ? player1Body : player2Body
    const bottomPlayerBody = topPlayerBody === player1Body ? player2Body : player1Body
    const topPlayerBottomY = topPlayerBody.y + topPlayerBody.halfHeight
    const bottomPlayerTopY = bottomPlayerBody.y - bottomPlayerBody.halfHeight
    // @TODO improve kill conditions!
    if (topPlayerBottomY <= bottomPlayerTopY) {
      const currentCharacters = Array.from(this.charactersByUuid.entries())
      const [topId, _] = currentCharacters.find(([_, character]) => character.body === topPlayerBody)
      const [bottomId, __] = currentCharacters.find(([_, character]) => character.body === bottomPlayerBody)
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
      const isStateMatching = currentUserBodyState.every((v, i) => v === this.lastUpdatePlayerBodyState[i])
      if (!isStateMatching) {
        this.lastUpdatePlayerBodyState = currentUserBodyState
        this.sendPlayerState()
      }
    }
  }

  updateDebugWidget (payload: CentralGameState) {
    const gameStateWidget = (this as any)._debug_widget || window.document.getElementById('game_state')!
    if (!(this as any)._debug_widget) {
      ;(this as any)._debug_widget = gameStateWidget
    }
    gameStateWidget.style.display = 'block'
    const debugState = {}
    for (let playerUuid in payload.playerStateByUuid) {
      let body = payload.playerStateByUuid[playerUuid].playerBodyState
      let localCharacter = this.charactersByUuid.get(parseInt(playerUuid))
      let localBody: Phaser.Physics.Arcade.Body | undefined
      if (localCharacter) localBody = localCharacter.body
      if (body) {
        debugState[playerUuid] = {
          acceleration: Object['values'](body.acceleration)
            .map(i => i.toFixed(0))
            .join(','),
          position: Object['values'](body.position)
            .map(i => i.toFixed(0))
            .join(','),
          velocity: Object['values'](body.velocity)
            .map(i => i.toFixed(0))
            .join(','),
          velocityLocal: !localBody
            ? 'no_local_body'
            : Object['values'](localBody.velocity)
              .map(i => i.toFixed(0))
              .join(',')
        }
      }
    }
    gameStateWidget.textContent = JSON.stringify(debugState, null, 2)
  }

  updateRemoteControlledGameState (state: CentralGameState) {
    if (!this.centralState || state.playerStateChangeCounter !== this.centralState.playerStateChangeCounter) {
      this.configurePlayers(state.playerStateByUuid)
    }
    this.centralState = state
    for (let [uuid, character] of this.charactersByUuid.entries()) {
      let playerState = state.playerStateByUuid[uuid]
      const targetX = playerState.playerBodyState.position.x
      const targetY = playerState.playerBodyState.position.y
      if (!playerState) {
        console.log(`destroying character: ${uuid}`)
        character.destroy()
        this.charactersByUuid.delete(uuid)
        return
      }
      // @TODO
      // @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO// @TODO
      // @TODO// @TODO// @TODO// @TODO// @TODO// @TODO
      // @TODO
      // @TODO
      // @TODO// @TODO
      // @TODO// @TODO
      // @TODO
      // schedule a "notification not received event" that is debounced, but,
      // have every call to this method call into it, so the debouce never actually
      // fires with a good connection.  when it does fire, all it does is set a flag
      // truthy, and the update loop catches it, and restarts the loopskie.
      if (this.player === character) {
        // don't update self from server.  be your own man
      } else if (playerState.playerBodyState) {
        let vx = playerState.playerBodyState.velocity.x
        // if things are running fast, just move the character
        console.log(character.body.position.x, targetX, character.body.position.y, targetY)
        if (character.body.position.x === targetX && character.body.position.y === targetY) {
          // no op
          console.log('player didnt move')
        } else if (this.msBetweenMessages < 25) {
          character.setPosition(targetX + character.body.width, targetY + character.body.halfHeight)
        } else {
          // otherwise, tween 'em over
          character.tween && character.tween.isPlaying && character.tween.stop()
          character.tween = this.add.tween({
            targets: character,
            x: targetX + character.body.width,
            y: targetY + character.body.halfHeight,
            delay: this.msBetweenMessages * 0.75
          })
        }
        character.body.setAcceleration(
          playerState.playerBodyState.acceleration.x,
          playerState.playerBodyState.acceleration.y
        )
        character.body.setVelocity(playerState.playerBodyState.velocity.x, playerState.playerBodyState.velocity.y)
        if (
          character.anims.currentAnim &&
          playerState.playerBodyState.currentAnimationName &&
          playerState.playerBodyState.currentAnimationName !== character.anims.currentAnim.key
        ) {
          character.animate(playerState.playerBodyState.currentAnimationName)
        }
        if (vx < -5 || vx > 5) {
          character.flipX = playerState.playerBodyState.velocity.x < 0
        }
      }
    }
  }

  removePlayer (uuid: number) {
    const character = this.charactersByUuid.get(uuid)
    if (!character) return console.warn(`character uuid ${uuid} not found`)
    character.destroy()
    this.characterGroup.remove(character)
    this.charactersByUuid.delete(uuid)
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
