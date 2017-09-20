var synaptic = require('synaptic')
const blessed = require('blessed')
const _ = require('lodash')
const jsonFile = require('jsonfile')
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

// Create a screen object.
var screen = blessed.screen({
  smartCSR: true
});

screen.title = 'Neural testing'

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0)
})

let myNetwork

try {
  myNetwork = Network.fromJSON(jsonFile.readFileSync('./data.json'))
} catch (e) {
  const inputLayer = new Layer(2)
  const hiddenLayer = new Layer(5)
  const outputLayer = new Layer(2)

  inputLayer.project(hiddenLayer)
  hiddenLayer.project(outputLayer)

  myNetwork = new Network({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
  })
}

const learningRate = .3

var box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: '',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
})

screen.append(box)
box.focus()

let botCounter = 0

class Bot {
  constructor(slow = false) {
    this.id = botCounter
    botCounter++
    this.slow = slow
    this.food = 100
    this.rest = 100
    this.alive = 1
    this.turnsAlive = 0
    this.lastAction = ''
    this.paint()
    this.update()

    screen.key(['p'], (ch, key) => {
      if (this.paused) {
        this.paused = false
        this.update()
      } else {
        this.paused = true
      }
    })

    screen.key(['s'], (ch, key) => {
      if (this.paused) {
        this.update()
      }
    })
  }

  paint() {
    box.setContent(`
      ${this.paused ? 'PAUSED\n\n' : ''}
      ID: ${this.id}\n
      Status: ${this.alive === 1 ? 'Alive' : 'Dead'}\n
      Time Alive: ${this.turnsAlive}\n
      Food: ${this.food}\n
      Rest: ${this.rest}\n
      Last Action: ${this.lastAction}
    `)
    screen.render()
  }

  dead() {
    this.alive = 0
    const lesson = [Math.abs((this.food / 100) - 1), Math.abs((this.rest / 100 - 1))]
    myNetwork.propagate(learningRate, lesson)
    this.paint()
    return
  }

  update(recurse = true, act = true) {
    this.turnsAlive++
    this.food--
    this.rest--

    if (this.food <= 0 || this.rest <= 0) return this.dead()
    this.paint()

    if (act) {
      var act = [this.food / 100, this.rest / 100]
      var actions = myNetwork.activate(act)
      let highest = 0

      const max = _.max(actions)
      var action = _.findIndex(actions, (a) => a === max)
      // if (action === 0)
      //   this.eat()
      // if (action === 1)
      //   return this.sleep()

    }

    if (recurse) {
      if (this.slow)
        setTimeout(() => !this.paused && this.update(), 200)
      else
        !this.paused && this.update()
    }
  }

  sleep() {
    if (!this.sleepCounter || this.sleepCounter <= 0) {
      this.sleepCounter = 30
      this.lastAction = 'Sleep'
    }

    this.sleepCounter--
    this.update(false, false)
    if (!this.alive) return
    this.rest += 2
    if (this.rest === 100) this.update()

    if (this.sleepCounter <= 0) this.update()
    else this.sleep()
  }

  eat() {
    this.lastAction = 'Eat'
    this.food = 100
  }
}

let bot = new Bot()
while (bot.turnsAlive <= 1000) {
  bot = new Bot()
  jsonFile.writeFileSync('./data.json', myNetwork.toJSON())
}

console.log(bot.turnsAlive)
