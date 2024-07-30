import * as net from 'net'
import fs from 'node:fs'
import zlib from 'zlib'

function deconstructData(data: Buffer) {
  const dataStr = data.toString()
  const dataArr = dataStr.split('\r\n')
  
  const method = dataArr.find(item => item.includes('HTTP'))?.split(' ')[0]
  const path = dataArr.find(item => item.includes('HTTP'))?.split(' ')[1]
  const body = dataArr[dataArr.length - 1]
  const encoding = dataArr.find(item => item.includes('Accept-Encoding'))?.split(': ')?.[1]
  const userAgent = dataArr.find(item => item.includes('User-Agent'))?.split(': ')?.[1]

  return {
    method,
    path,
    body,
    encoding,
    userAgent
  }
}

const server = net.createServer(socket => {
  socket.on('data', data => {
    const { method, path, body, encoding, userAgent } = deconstructData(data)
    

    if (method === 'GET') {
      if (path === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n')
      } else if (path?.includes('echo')) {
        const response = path.split('/')
        const msg = response[response.length - 1]

        if(encoding?.includes('gzip')) {
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

      } else if (path?.includes('user-agent')) {
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent?.length}\r\n\r\n${userAgent}`
        )
      } else if (path?.includes('files')) {
        const fileName = path.split('files/')[1]
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
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
      }
    } else if (method === 'POST') {
      if (path?.includes('files')) {
        const fileName = path.split('files/')[1]
        const tmpFolder = process.argv[3]

        fs.writeFileSync(`${tmpFolder}/${fileName}`, body)

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
