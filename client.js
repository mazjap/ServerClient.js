const net = require("net")
const CommandParser = require("./CommandParser")

const port = 3001

const client = net.createConnection({port: port}, () => {
  process.stdin.setEncoding("utf8")
  
  process.stdin.on("readable", () => {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      // Send data to server
      client.write(`${chunk}`)
    }
  })

  process.stdin.on("end", () => client.end())
})

// Show data from server
client.on("data", (data) => {
  const messages = data.toString().split("\n")

  for (const message of messages) {
    const command = CommandParser.parse(message)

    switch (command?.name) {
      case CommandParser.Commands.clientName:
        if (command.args[0]) {
          client.name = command.args[0]
        } else {
          client.name
        }

        console.log("Welcome, " + client.name)

        break
      default:
        console.log(message)
        break
    }
  }
})

process.on("exit", () => {
  client.end()
})

client.on("end", () => {
  console.log("Server on port #" + port + " was killed")
  process.exit()
})