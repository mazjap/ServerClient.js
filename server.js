const fs = require("fs")
const CommandParser = require("./CommandParser")

function includesWhere(iterable, callback) {
    for (const item of iterable) {
        if (callback(item)) {
            return true
        }
    }

    return false
}

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

        const clientNameChanged = (toName) => {
            client.write(`/${CommandParser.ServerCommands.clientName.name} ${toName}`)
        }

        clientNameChanged(client.name)
    
        server.clients.push(client)

        const usernameCommand = (client, newName) => {
            server.log(client.name + " requested their name to be changed to " + newName)
            if (newName) {
                for (const tmpClient of server.clients) {
                    console.log(tmpClient.name)
                    console.log(tmpClient.name === newName)
                }

                if (includesWhere(server.clients, (tmpClient) => tmpClient.name === newName)) {
                    server.sendMessageToSelectClients("This name is already taken: " + newName, (tmpClient) => tmpClient.name === client.name)
                } else {
                    server.sendMessageToSelectClients(client.name + " changed their name to " + newName + ".", tmpClient => { return tmpClient.id !== client.id })
                    client.name = newName
                    clientNameChanged(client.name)
                }
            }
        }

        const whisperCommand = (client, toClientName, message) => {
            const selectedClient = server.clients.find(tmpClient => tmpClient.name == toClientName)
            if (selectedClient) {
                server.sendMessageToSelectClients(client.name + " whispers: " + message, (tmpClient) => tmpClient.id === selectedClient.id)
            } else {
                throw Error("Unable to send message to " + toClientName + ". Does this user exist?")
            }
        }

        const kickCommand = (client, password, toClientName) => {
            const selectedClient = server.clients.find(tmpClient => tmpClient.name == toClientName)

            if (!selectedClient) {
                throw Error("Unable to kick client with name " + toClientName + ". No client with that name exists.")
            }

            if (password !== "password") {
                throw Error("Unable to kick client with name " + toClientName + ". Invalid password. (password is 'password')")
            }
            
            server.sendMessageToSelectClients("You have been kicked from the server by " + client.name + ".", (tmpClient) => tmpClient.id === selectedClient.id)
            server.removeClient(selectedClient.id)
        }

        const clientListCommand = () => {
            let message = "Client list:"

            server.clients.forEach(function(clt) {
                message += `\n${clt.name}: Id: ${clt.id}`
            })

            server.sendMessageToSelectClients(message, (tmpClient) => tmpClient.id === client.id)
        }

        const helpCommand = (client) => {
            server.sendMessageToSelectClients(CommandParser.helpString(), (tmpClient) => tmpClient.id === client.id)
        }
    
        client.on("data", function(data) {
            // On receive data from client
            const message = data.toString().trim()
            
            const displayMessage = () => {
                server.sendMessageToSelectClients(client.name + ": " + message, tmpClient => { return tmpClient.id !== client.id })
            }

            if (message[0] == "/") {
                try {
                    const command = CommandParser.parse(message)

                    switch (command.name) {
                    case CommandParser.ClientCommands.username.name:
                        usernameCommand(client, command.args[0])
        
                        break
                    case CommandParser.ClientCommands.w.name:
                        whisperCommand(client, command.args[0], command.args.slice(1).join(" "))

                        break
                    case CommandParser.ClientCommands.kick.name:
                        kickCommand(client, command.args[0], command.args[1])

                        break
                    case CommandParser.ClientCommands.clientList.name:
                        clientListCommand(client)

                        break
                    case CommandParser.ClientCommands.help.name:
                        helpCommand(client)
                        
                        break
                    default:
                        throw Error(`/${command.name} is not a valid command. Use /help to see what commands are available.`)
                    }
                } catch(e) {
                    client.write(e.message)
                }
            } else {
                displayMessage()
            }
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

    static defaultPort = process.env.port || 3001
}

module.exports = { Server }