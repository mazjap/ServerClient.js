const net = require("net")
const CommandParser = require("./CommandParser")

const port = 3001

let nameWasSet = false

const client = net.createConnection({port: port}, () => {
  process.stdin.setEncoding("utf8")
  console.log("Use /help to see all commands")
  
  process.stdin.on("readable", () => {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      // Send data to server
      client.write(`${chunk}`)
    }
  })

  process.stdin.on("end", client.end)
})

// Show data from server
client.on("data", (data) => {
  const messages = data.toString().split("\n")

  for (const message of messages) {
    try {
      const command = CommandParser.parse(message)

      switch (command?.name) {
        case CommandParser.ServerCommands.clientName.name:
          if (command.args[0]) {
            client.name = command.args[0]
            console.log("Name changed to " + client.name)
          }

          break
        default:
          console.log(message)
          break
      }
    } catch(e) {
      console.log(message)
    }
  }
})

process.on("exit", () => {
  client.end()
})

client.on("end", () => {
  process.exit()
})