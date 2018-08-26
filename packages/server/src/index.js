const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 9999 })

wss.on('connection', function connection (ws) {
  const emit = msg => ws.send(JSON.stringify(msg))
  ws.on('message', function incoming (raw) {
    const message = JSON.parse(raw)
    if (message.type === 'REQUEST_CHARACTER') {
      emit({
        type: 'ASSIGN_CHARACTER',
        payload: {
          type: 'king',
          team: 'blue'
        }
      })
    } else if (message.type === 'BLAH') {
    } else {
      console.warn(`UNSUPPORTED MESSAGE: ${raw}`)
    }
  })
})
