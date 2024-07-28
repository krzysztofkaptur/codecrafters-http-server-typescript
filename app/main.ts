import * as net from 'net'

const server = net.createServer(socket => {
  socket.on('close', () => {
    socket.write('HTTP/1.1 200 OK\r\n\r\n')
    socket.end()
  })
})

server.listen(4221, 'localhost')
