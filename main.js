var synaptic = require('synaptic')
const blessed = require('blessed')
const _ = require('lodash')
const jsonFile = require('jsonfile')
var Neuron = synaptic.Neuron,
	Layer = synaptic.Layer,
	Network = synaptic.Network,
	Trainer = synaptic.Trainer,
	Architect = synaptic.Architect;

const slow = true

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

let box, screen
if (slow) {
	// Create a screen object.
	screen = blessed.screen({
	  smartCSR: true
	});

	screen.title = 'Neural testing'

	screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	  return process.exit(0)
	})

	box = blessed.box({
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
}

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
		this.actionNumber = 0
    this.actions = []
		this.pain = {
			hunger: 0,
			tired: 0
		}
    this.paint()
    this.update()

		if (slow) {
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
  }

	addAction(action) {
		if (this.actions.length >= 10)
 			this.actions = this.actions.slice(0, 9)
		this.actions.unshift(action + ' ' + this.actionNumber)
		this.actionNumber++
	}

	getActions() {
		let count = 0
		return _.reduce(this.actions, (result, a) => {
			count++
			return result + `${count}. ${a}\n`
		}, '')
	}

  paint() {
		if (slow) {
			box.setContent(`
${this.paused ? 'PAUSED\n' : ''}
${this.sleeping ? 'SLEEPING\n' : ''}
ID: ${this.id}
Status: ${this.alive === 1 ? 'Alive' : 'Dead'}
Time Alive: ${this.turnsAlive}
Food: ${this.food}
Rest: ${this.rest}
Last Actions:
${this.getActions()}
				`)
				screen.render()
		} else {
			console.log(`
ID: ${this.id}
Status: ${this.alive === 1 ? 'Alive' : 'Dead'}
Time Alive: ${this.turnsAlive}\n
Food: ${this.food}\n
Rest: ${this.rest}\n
Last Actions: \n
${this.getActions()}
			`)
		}
  }

  dead() {
    this.alive = 0
    const lesson = [Math.abs((this.food / 100) - 1), Math.abs((this.rest / 100 - 1))]
    myNetwork.propagate(learningRate, lesson)
    this.paint()
    return
  }

	updatePain() {
		this.pain = {
			hunger: Math.abs(this.food - 100),
			tired: Math.abs(this.rest - 100)
		}
		if (this.pain.huger > 30 || this.pain.tired > 30) {
			myNetwork.propagate(learningRate, [this.pain.hunger / 100, this.pain.tired / 100])
		}
	}

  update(recurse = true, act = true) {
    this.turnsAlive++
    this.food--
    this.rest--

    if (this.food <= 0 || this.rest <= 0) return this.dead()
		this.updatePain()
    this.paint()

    if (act) {
      var act = [this.food / 100, this.rest / 100]
      var actions = myNetwork.activate(act)
      let highest = 0

      const max = _.max(this.rest < 70 ? actions : actions.splice(1, 1))
      var action = _.findIndex(actions, (a) => a === max)
      if (action === 0)
        this.eat()
      if (action === 1 && this.rest < 70)
        return this.sleep()
    }

    if (recurse) {
      if (this.slow)
        return setTimeout(() => !this.paused && this.update(), 200)
      else {
				if (!this.paused) {
					return this.update()
				}
			}
    }
  }

  sleep() {
		if (this.rest >= 100) {
			this.rest = 100
			return this.update()
		}
    if (!this.sleepCounter || this.sleepCounter <= 0) {
      this.sleepCounter = 30
			this.sleeping = true
			this.addAction('Sleep')
    }

    this.sleepCounter--
    if (!this.alive) return this.dead()
    this.rest += 3
		if (this.rest > 100) this.rest = 100
    if (this.rest === 100) {
			this.sleeping = false
			return this.update()
		}
		else this.update(false, false)

    if (this.sleepCounter <= 0) {
			this.sleeping = false
			return this.update()
		}
    else this.slow ? setTimeout(() => this.sleep(), 200) : this.sleep()
  }

  eat() {
    this.addAction('Eat')
    this.food = 100
  }
}

let bot = new Bot(slow)
if (!slow) {
	while (bot.turnsAlive <= 10000) {
		bot = new Bot(slow)
		jsonFile.writeFileSync('./data.json', myNetwork.toJSON())
	}
}

console.log(bot.turnsAlive)
