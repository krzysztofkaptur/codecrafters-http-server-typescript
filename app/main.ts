import * as net from 'net'
import fs from 'node:fs'
import path from 'path'

const server = net.createServer(socket => {
  socket.on('data', data => {
    const dataStr = data.toString()
    const pathStr = dataStr.split(' ')[1]

    if (pathStr === '/') {
      socket.write('HTTP/1.1 200 OK\r\n\r\n')
    } else if (pathStr.includes('echo')) {
      const response = pathStr.split('/')
      const msg = response[response.length - 1]

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${msg.length}\r\n\r\n${msg}`
      )
    } else if (pathStr.includes('user-agent')) {
      const userAgent = dataStr
        .split('User-Agent:')[1]
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .trim()

      console.log(userAgent)

      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
      )
    } else if (pathStr.includes('files')) {
      const fileName = pathStr.split('files/')[1]
      const tmpFolder = path.join(__dirname, 'tmp')

      if (fs.existsSync(`${tmpFolder}/${fileName}`)) {
        const fileContent = fs.readFileSync(`${tmpFolder}/${fileName}`, 'utf-8')
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`
        )
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      }
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
