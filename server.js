const net = require("net")
const fs = require("fs")

class Server {
  static defaultPort = 3000

  constructor(clients=[], portNumber=null) {
    if (portNumber) {
      if (isNaN(portNumber)) {
        // Value was given, but could not be set
        this.port = Self.defaultPort
        this.log("Unable to set port from given input: " + portNumber)
      } else {
        // Value was given and is valid
        this.port = portNumber
      }
    } else {
      // No value was given
      this.port = Self.defaultPort
    }

    this.clients = clients
  }

  addClient(client) {
    let server = this

    client.setEncoding("utf8")
    // Hopefully no collisions
    client.id = Math.floor(Math.random() * 10_000)
    client.name = "Client #" + client.id

    server.clients.push(client)


    client.on("data", function(data) {
      // On receive data from client
      const id = client.id
      const message = client.name + ": " + data.toString().trim()
      console.log(server ? "No null" : "null")
      console.log(typeof(server))
      console.log(id)
      console.log(server.clients.length)
      server.sendMessageToSelectClients(message, function(tmpClient) { return tmpClient.id !== id })
    })
  
    client.on("end", function() {
      server.removeClient(client.id)
    })

    server.sendMessageToSelectClients("Welcome, " + client.name, tmpClient => tmpClient.id !== client.id)
  }

  removeClient(id) {
    const index = this.clients.findIndex(client => client.id === id)

    if (index === -1) return

    const client = this.clients[index]

    this.clients.splice(index, 1)
    this.log(client.name + " left the server")
  }

  sendMessageToAllClients(msg) {
    this.sendMessageToSelectClients(msg, () => true)
  }
  
  sendMessageToSelectClients(msg, evaluateIsSelectClient = client => client.id !== client.id) {
    this.log(msg)
    for (const client of server.clients) {
      if (evaluateIsSelectClient(client)) {
        client.write(msg)
      }
    }
  }

  log(...strings) {
    for (const message of strings) {
      console.log(message)
      fs.appendFile("./chat.txt", Server.currentTimestamp() + " " + message + "\n", () => {})
    }
  }

  static currentTimestamp() {
    const now = new Date()

    const date = 
      ((now.getDate() < 10) ? "0" : "") + 
      now.getDate() + 
      "/" +
      (((now.getMonth() + 1) < 10) ? "0" : "") + 
      (now.getMonth() + 1) + 
      "/" + 
      now.getFullYear()
    
    const time = 
      ((now.getHours() < 10) ? "0" : "") + 
      ((now.getHours() > 12) ? (now.getHours() - 12) : now.getHours()) + 
      ":" + 
      ((now.getMinutes() < 10) ? "0" : "") + 
      now.getMinutes() + 
      ":" + 
      ((now.getSeconds() < 10) ? "0" : "") + 
      now.getSeconds() + 
      ((now.getHours() > 12) ? "PM" : "AM")

    return date + " " + time
  }
}

let server = new Server([], process.argv[2])

net.createServer(socket => {
  server.addClient(socket)
}).listen(server.port, () => {
  server.log(`server is listening on port ${server.port}`)
}).on("end", () => {
  server.log("Server on port #" + server.port + " was terminated with " + server.clients.length + " clients.")
})