// import {
//   KingClientMessage,
//   KingServerMessage,
//   CentralGameState,
//   PlayerStateByUuid,
//   DEATH_ANIMATION_DURATION
// } from 'common'
// import { GameMessages } from '../../interfaces'

// export const listen = () => {
//   const ws = new WebSocket(`ws://${location.host}/api`)
//   const gid = window.sessionStorage.getItem('gameId')
//   const tid = window.sessionStorage.getItem('teamId')
//   const uid = window.sessionStorage.getItem('userId')
//   ws.addEventListener('open', function open () {
//     ws.send(
//       JSON.stringify({
//         type: KingClientMessage.REQUEST_CHARACTER,
//         payload: {
//           cached: {
//             gid,
//             tid,
//             uid
//           }
//         }
//       })
//     )
//   })
//   ws.addEventListener('error', (evt: Event) => {
//     this.bus.emit(GameMessages.SocketError)
//   })
//   ws.addEventListener('message', ({ data }) => {
//     this.onMessage(data)
//   })
//   return ws
// }
