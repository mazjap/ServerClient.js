const net = require('net')
const port = 3000

const client = net.createConnection({port: port}, () => {
  console.log('connected to server!')

  process.stdin.setEncoding('utf8')
  
  process.stdin.on('readable', () => {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      // Send data to server
      client.write(`${chunk}`)
    }
  })

  process.stdin.on('end', () => client.end())
})

// Show data from server
client.on('data', (data) => {
  console.log(data.toString())
})

client.on('end', () => {
  console.log('Goodbye')
})