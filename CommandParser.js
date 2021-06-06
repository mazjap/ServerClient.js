const ClientCommands = {
    
}

const ServerCommands = {
    clientName: "clientName"
}

const Commands = Object.freeze({...ClientCommands, ...ServerCommands})

function parseCommand(message) {
    if (!isCommand(message)) return

    const spaceSeperated = message.split(" ")

    return { 
        name: spaceSeperated[0].slice(1),
        args: spaceSeperated.slice(1)
    }
}

function isCommand(message) {
    const nameEndIndex = message.indexOf(" ")

    if (message &&
        message.length > 1 &&
        nameEndIndex !== -1 &&
        message[0] === "/" &&
        Object.keys(Commands).includes(message.slice(1, nameEndIndex))) {
        return true
    }

    return false
}

function isCommandFromServer(command) {
    return Object.keys(ServerCommands).includes(command.name)
}

module.exports = { Commands, isCommand, isCommandFromServer, parse: parseCommand }