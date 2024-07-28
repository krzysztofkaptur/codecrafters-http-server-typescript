import * as net from 'net'

const server = net.createServer(socket => {
  socket.on('data', data => {
    const dataStr = data.toString()
    const path = dataStr.split(' ')[1]

    if (path === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n')
    } else if (path.includes('echo')) {
      const response = path.split('/')
      const msg = response[response.length - 1]

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\n${msg}`
      )
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    }
  })

  socket.on('close', () => {
    console.log('close')
    socket.end()
  })
})

server.listen(4221, 'localhost', () => console.log('listening'))
