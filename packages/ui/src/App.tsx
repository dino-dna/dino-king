import './App.css'
import * as React from 'react'
import * as game from './game/index'

export class App extends React.Component {
  private gameContainer: HTMLElement | null
  constructor (props: any) {
    super(props)
    this.gameContainer = null
  }
  componentDidMount () {
    ;(window as any).game = new game.MurderKing(game.config)
  }
  public render () {
    return (
      <div className='App'>
        <div id='game' ref={node => (this.gameContainer = node)} />
      </div>
    )
  }
}
