import * as net from 'net'
import fs from 'node:fs'
import zlib from 'zlib'

const server = net.createServer(socket => {
  socket.on('data', data => {
    const dataStr = data.toString()
    const pathStr = dataStr.split(' ')[1]
    const method = dataStr.split(' ')[0]
    const acceptEncoding = dataStr.split('\r\n')?.[dataStr.split('\r\n')?.findIndex(item => item.includes("Accept-Encoding"))]?.split(": ")?.[1] || ''

    if (method === 'GET') {
      if (pathStr === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n')
      } else if (pathStr.includes('echo')) {
        const response = pathStr.split('/')
        const msg = response[response.length - 1]

        if(acceptEncoding.includes('gzip')) {
          const buf = Buffer.from(msg, 'utf-8')
          const gzipMsg = zlib.gzipSync(buf)
          
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${gzipMsg.length}\r\n\r\n`
          )
          socket.write(gzipMsg)
        } else {
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${msg.length}\r\n\r\n${msg}`
          )
        }

      } else if (pathStr.includes('user-agent')) {
        const userAgent = dataStr
          .split('User-Agent:')[1]
          .replace(/\r\n/g, '')
          .trim()

        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
        )
      } else if (pathStr.includes('files')) {
        const fileName = pathStr.split('files/')[1]
        const tmpFolder = process.argv[3]

        if (fs.existsSync(`${tmpFolder}/${fileName}`)) {
          const fileContent = fs.readFileSync(
            `${tmpFolder}/${fileName}`,
            'utf-8'
          )
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${fileContent.length}\r\n\r\n${fileContent}`
          )
        } else {
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        }
      } else if(pathStr.includes("echo")) {
        console.log("dupa")
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      }
    } else if (method === 'POST') {
      if (pathStr.includes('files')) {
        const fileName = pathStr.split('files/')[1]
        const tmpFolder = process.argv[3]

        const bodyArr = dataStr.split('\r\n\r\n')
        const content = bodyArr[bodyArr.length - 1]

        fs.writeFileSync(`${tmpFolder}/${fileName}`, content)

        socket.write('HTTP/1.1 201 Created\r\n\r\n')
      }
    }
  })

  socket.on('close', () => {
    console.log('close')
    socket.end()
  })
})

server.listen(4221, 'localhost', () => console.log('listening'))
