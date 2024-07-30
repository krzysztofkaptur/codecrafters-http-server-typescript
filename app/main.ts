import * as net from 'net'
import fs from 'node:fs'
import zlib from 'zlib'

const METHODS = {
  GET: 'GET',
  POST: 'POST'
} as const

type Method = typeof METHODS[keyof typeof METHODS]

const STATUSES = {
  200: "200 OK",
  201: "201 Created",
  404: "404 Not Found"
} as const

type Status = keyof typeof STATUSES

function deconstructData(data: Buffer) {
  const dataStr = data.toString()
  const dataArr = dataStr.split('\r\n')
  
  const method = dataArr.find(item => item.includes('HTTP'))?.split(' ')[0] as Method
  const path = dataArr.find(item => item.includes('HTTP'))?.split(' ')[1]
  const body = dataArr[dataArr.length - 1]
  const encoding = dataArr.find(item => item.includes('Accept-Encoding'))?.split(': ')?.[1]
  const userAgent = dataArr.find(item => item.includes('User-Agent'))?.split(': ')?.[1]
  const msg = path?.split('/')?.[path?.split('/').length - 1]

  return {
    method,
    path,
    body,
    encoding,
    userAgent,
    msg
  }
}

function writeResponse(socket: net.Socket, status: Status) {
  socket.write(`HTTP/1.1 ${STATUSES[status]}\r\n\r\n`)
}

const server = net.createServer(socket => {
  socket.on('data', data => {
    const { method, path, body, encoding, userAgent, msg } = deconstructData(data)
    
    if (method === METHODS.GET) {
      if (path === '/') {
        writeResponse(socket, 200)
      } else if (path?.includes('echo')) {
        if(encoding?.includes('gzip') && msg) {
          const buf = Buffer.from(msg, 'utf-8')
          const gzipMsg = zlib.gzipSync(buf)

          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${gzipMsg.length}\r\n\r\n`
          )
          socket.write(gzipMsg)
        } else {
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${msg?.length}\r\n\r\n${msg}`
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
          writeResponse(socket, 404)
        }
      } else {
        writeResponse(socket, 404)
      }
    } else if (method === METHODS.POST) {
      if (path?.includes('files')) {
        const fileName = path.split('files/')[1]
        const tmpFolder = process.argv[3]

        fs.writeFileSync(`${tmpFolder}/${fileName}`, body)

        writeResponse(socket, 201)
      }
    }
  })

  socket.on('close', () => {
    console.log('close')
    socket.end()
  })
})

server.listen(4221, 'localhost', () => console.log('listening'))
