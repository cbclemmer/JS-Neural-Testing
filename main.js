const jsonFile = require('jsonfile')
const { Network } = require('synaptic')
const Bot = require('./bot')

const gui = process.argv[2] === 'gui'

let myNetwork

try {
  myNetwork = Network.fromJSON(jsonFile.readFileSync('./data.json'))
} catch (e) {
  myNetwork = require('./network')
}

let render
if (gui) {
  const blessedConfig = require('./screen')
  const box = blessedConfig.box
  const screen = blessedConfig.screen

  render = (text) => {
    box.setContent(text)
    screen.render()
  }
}

let botCounter = 0

let bot = new Bot(myNetwork, render, botCounter, gui)

if (gui) return

let highest = 0
while (bot.turnsAlive <= 1000) {
  bot = new Bot(myNetwork, render, botCounter, gui, (turnsAlive) => console.log(turnsAlive))
  if (bot.turnsAlive > highest) {
    highest = bot.turnsAlive
    console.log('\n' + highest)
  }
}
console.log('Highest: ' + highest)

jsonFile.writeFile('./data.json', myNetwork.toJSON(), (err) => {
  if (err) console.error(err)
  console.log('Wrote network')
})
