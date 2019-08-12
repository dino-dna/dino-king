import './App.css'
import * as React from 'react'
import * as game from './game/index'
import { GameMessages, GameState } from './interfaces'
import cx from 'classnames'
const nanobus = require('nanobus')

export interface IAppState {
  gameState: GameState
}

function assertNever (x: never): never {
  throw new Error('Unexpected object: ' + x)
}

export class App extends React.Component<any, IAppState> {
  private gameContainer: HTMLElement | null
  private bus: any
  constructor (props: any) {
    super(props)
    this.gameContainer = null
    this.bus = nanobus()
    this.state = {
      gameState: { error: false, type: 'Starting' }
    }
  }
  componentDidMount () {
    ;(window as any).bus = this.bus
    this.bus.on(GameMessages.SocketError, () => {
      this.setState({ gameState: { error: true, type: 'SocketError' } })
    })
    this.bus.on(GameMessages.GameShutdown, () => {
      this.setState({ gameState: { error: false, type: 'Stopped' } })
    })
    ;(window as any).game = new game.MurderKing(game.config)
  }
  componentWillUnmount () {
    delete window['bus']
  }
  private renderBanner (content: string) {
    return (
      <div className='banner__state--error'>
        <p>{content}</p>
      </div>
    )
  }
  public render () {
    const {
      gameState: { type, error }
    } = this.state
    const isGameRunning = !error && type !== 'Stopped'
    const gameStateClassNames = cx('game-state__pane', {
      'game-state__pane--visible': isGameRunning
    })
    let banner
    let gameNode
    let greatSuff
    switch (type) {
      case 'Running':
      case 'Starting':
        gameNode = <div id='game' ref={node => (this.gameContainer = node)} />
        break
      case 'SocketError':
        banner = this.renderBanner(type)
        break
      case 'Stopped':
        greatSuff = <p>Sup dawgs! Join a game</p>
        break
      default:
        // https://www.typescriptlang.org/docs/handbook/advanced-types.html
        // see exhaustive checking
        return assertNever(type)
    }
    const appClassnames = cx('App', {
      'App--error': !!error,
      'App--running': isGameRunning
    })
    return (
      <div className={appClassnames}>
        {banner}
        {isGameRunning && gameNode}
        {greatSuff}
        <pre id='game_state' className={gameStateClassNames} />
      </div>
    )
  }
}
