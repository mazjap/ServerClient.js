const net = require("net")
const s = require("./Server")

let server = new s.Server([], s.Server.defaultPort)

let netServer = net.createServer(socket => {
  server.addClient(socket)
})

netServer.listen(server.port, () => {
  server.log("Server was started on port " + server.port)
})

netServer.on("close", () => {
  server.log("Server on port " + server.port + " was killed")
})

const exit = (options, exitCode) => {
  if (exitCode || exitCode === 0) {
    console.log("Process exitted with code: " + exitCode)
  }

  if (options.cleanup) {
    server.killAllConnections()
    netServer.close()
  }

  if (options.exit) process.exit()
}

process.on("SIGINT", exit.bind(null, {exit: true}))
process.on("SIGUSR1", exit.bind(null, {exit: true}))
process.on("SIGUSR2", exit.bind(null, {exit: true}))
process.on("exit", exit.bind(null, {cleanup: true}))
process.on("uncaughtException", exit.bind(null, {exit: true}))