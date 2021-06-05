const net = require('net')
const port = 3000
let clients = []

const sendData = msg => {
  sendDataToSelect(msg, () => true)
}

const sendDataToSelect = (msg, callback = client => client.remotePort !== socket.remotePort) => {
  for (const client of clients) {
    if (callback(client)) {
      client.write(msg)
    }
  }
}

const server = net.createServer(socket => {
  socket.setEncoding('utf8')

  socket.index = clients.length
  socket.name = "Client #" + socket.index
  clients.push(socket)

  const welcomeMessage = "Welcome, " + socket.name
  sendData(welcomeMessage)
  console.log(welcomeMessage)

  socket.remotePort

  socket.on('data', data => {
    // On receive data from client
    const message = socket.name + ": " + data.toString().trim()
    console.log(message)
    sendDataToSelect(message, client => client.remotePort !== socket.remotePort)
    // sendData(message)
  })

  socket.on('end', socket.end)
})

server.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})