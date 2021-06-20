const SharedCommands = {
    clientList: {
        name: "clientList",
        args: [],
        description: "Prints a list containing all connected clients."
    },
    help: {
        name: "help",
        args: [],
        description: "Prints the commands available to the caller."
    }
}

const ClientCommands = {
    username: {
        name: "username",
        args: ["newName"],
        description: "Allows a client to change their display name."
    },
    kick: {
        name: "kick",
        args: ["password", "clientName"],
        description: "Removes a client from the server."
    },
    w: {
        name: " to w",
        args: ["clientName", "messages"],
        description: "Sends a message to an individual client."
    },
    ...SharedCommands,
}

const ServerCommands = {
    clientName: {
        name: "clientName",
        args: ["name"],
        description: "Passes the clients name to the client as a message."
    },
    // kick: {
    //     name: "kick",
    //     args: ["clientName"],
    //     description: ClientCommands.kick.description
    // },
    ...SharedCommands
}

const Commands = Object.freeze({...ClientCommands, ...ServerCommands})

function parseCommand(message) {
    if (!isCommand(message)) throw Error(`The provided message is not a properly formatted: ${message}`)

    const spaceSeperated = message.split(" ")

    // The /commandName without the '/'
    const commandName = spaceSeperated[0].slice(1)

    // The list of arguments after the command name
    const args = spaceSeperated.slice(1)

    const commandTemplate = Commands[Object.keys(Commands).find(key => key == commandName)]

    if (args.length !== commandTemplate.args.length && commandName !== "w") {
        const expected = `Expected: /${commandTemplate.name} ` + commandTemplate.args.reduce((fullMessage, currentItem) => {
            return fullMessage + ` <currentItem>`
        })
        throw Error(`Command given: "${message}"\n` + expected)
    }

    let command = {
        name: commandName,
        args: args,
        asCommand: function() {
            return `/${this.name} ${this.args.join(" ")}`
        }
    }

    command.isFromServer = isCommandFromServer(command)

    return command
}

function helpString() {
    let message = "Commands:"

    for (const commandKey in ClientCommands) {
        const command = ClientCommands[commandKey]
        message += `\n\n\t/${command.name} ${command.args ? command.args.join(" ") : ""}\n\tDescription: ${command.description}`
    }

    return message
}

function isCommand(message) {
    const commandName = message.split(" ")[0]

    if (commandName[0] === "/" &&
        Commands[commandName.slice(1)]) {
        return true
    }

    return false
}

function isCommandFromServer(command) {
    return Object.keys(ServerCommands).includes(command?.name)
}

module.exports = { ClientCommands, ServerCommands, helpString, isCommand, isCommandFromServer, parse: parseCommand }