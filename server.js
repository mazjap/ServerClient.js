const fs = require("fs")
const CommandParser = require("./CommandParser")

class Server {
    constructor(clients=[], portNumber=null) {
        this.clients = clients

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
            this.port = Server.defaultPort
        }
    }
  
    addClient(client) {
        client.setEncoding("utf8")
        
        let server = this
    
        // Hopefully no collisions
        client.id = Math.floor(Math.random() * 10_000)
        client.name = "Client#" + client.id

        client.write(`/${CommandParser.Commands.clientName} ${client.name}\n`)
    
        server.clients.push(client)
    
        client.on("data", function(data) {
            // On receive data from client
            const id = client.id
            const message = client.name + ": " + data.toString().trim()

            server.sendMessageToSelectClients(message, tmpClient => { return tmpClient.id !== client.id })
        })
        
        client.on("end", function() {
            server.removeClient(client.id)
        })
        
        server.sendMessageToSelectClients(client.name + " has joined the server", tmpClient => tmpClient.id !== client.id)
    }
  
    removeClient(id) {
        const index = this.clients.findIndex(client => client.id === id)
    
        if (index === -1) return
    
        const client = this.clients[index]
    
        this.clients.splice(index, 1)
        this.sendMessageToAllClients(client.name + " left the server")
        client.end()
    }
  
    sendMessageToAllClients(msg) {
        this.sendMessageToSelectClients(msg, () => true)
    }
    
    sendMessageToSelectClients(msg, evaluateIsSelectClient = () => { return true }) {
        this.log(msg)
        for (const client of this.clients) {
            if (evaluateIsSelectClient(client)) {
                client.write(msg)
            }
        }
    }
  
    log(...strings) {
        this._log(false, ...strings)
    }

    logSync(...strings) {
        this._log(true, ...strings)
    }

    _log(isSync, ...strings) {
        for (const message of strings) {
            console.log(message)
            const file = "chat.txt"
            const formattedMessage = Server.currentTimestamp() + " " + message + "\n"

            if (isSync) {
                fs.appendFileSync(file, formattedMessage, "utf8")
            } else {
                fs.appendFile(file, formattedMessage, "utf8", () => {})
            }
        }
    }

    killAllConnections() {
        for (const client of this.clients) {
            client.end()
        }

        this.log("Server on port " + this.port + " was terminated")
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

    static defaultPort = 3001
}

module.exports = { Server }