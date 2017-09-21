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
	/*
	INPUTS: (stats)
	hunger
	rest
	money
	OUTPUTS: (Actions)
	Eat
	Sleep
	Buy
	Work
	*/

  const inputLayer = new Layer(3)
  const hiddenLayer = new Layer(6)
  const outputLayer = new Layer(4)

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

class Food {
	constructor(nutrition) {
		this.nutrition = nutrition
		this.cost = 10
	}
}

class Apple extends Food {
	constructor() {
		super(20)
		this.name = 'Apple'
	}
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
		this.currentAction = ''
		this.pain = {
			hunger: 0,
			tired: 0
		}
		this.inventory = [new Apple(), new Apple(), new Apple(), new Apple(), new Apple()]
		this.money = 10
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

	buy() {
		if (this.money < 10)
			return myNetwork.propagate(learningRate, [this.pain.hunger / 100, this.pain.tired / 100, 0, 1])
		if (this.inventory.length > 8) return
		this.inventory.push(new Apple())
		this.money -= 10
		this.addAction('Buy')
	}

	addAction(action) {
		if (this.actions.length >= 10)
 			this.actions = this.actions.slice(0, 9)
		this.actions.unshift(action + ' ' + this.actionNumber)
		this.actionNumber++
	}

	getActions() {
		let count = 0
		let actionsCount = -1
		var actions = ['Eat', 'Sleep', 'Buy', 'Work']

		return _(this.currentAction)
			.map((a) => {
				actionsCount++
				return { name: actions[actionsCount], value: a }
			})
			.orderBy(['value'], ['desc'])
			.reduce((result, a) => {
				count++
				return result + `${count}. ${a.name}: ${a.value}\n`
			}, '')
	}

	getLastActions() {
		let count = 0
		return _.reduce(this.actions, (result, a) => {
			count++
			return result + `${count}. ${a}\n`
		}, '')
	}

	getInventory() {
		let count = 0
		return _.reduce(this.inventory, (result, i) => {
			count++
			return result + `${count}. ${i.name}\n`
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
Money: ${this.money}
Inventory:
${this.getInventory(this.inventory)}
Current Action:
${this.getActions()}
Last Actions:
${this.getLastActions()}
				`)
				screen.render()
		} else {
			console.log(`
ID: ${this.id}
Status: ${this.alive === 1 ? 'Alive' : 'Dead'}
Time Alive: ${this.turnsAlive}
Food: ${this.food}
Rest: ${this.rest}
Money: ${this.money}
Inventory:
${this.getInventory(this.inventory)}
Current Action:
${this.getActions()}
Last Actions:
${this.getLastActions()}
			`)
		}
  }

  dead() {
    this.alive = 0
    const lesson = [
			Math.abs((this.food / 100) - 1), // Eat when food is low
			Math.abs((this.rest / 100 - 1)), // Sleep when rest is low
			Math.abs(this.money / 100), // Buy when you have lots of money
			Math.abs(this.money / 100 - 1) // Work when you have little money
		]
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
			myNetwork.propagate(learningRate, [this.pain.hunger / 100, this.pain.tired / 100, Math.abs(this.money / 100 ), Math.abs(this.money / 100 - 1)])
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
      var act = [this.food / 100, this.rest / 100, this.money / 100]
      var actions = myNetwork.activate(act)
      let highest = 0

			this.currentAction = actions
      const max = _.max(actions)
      var action = _.findIndex(actions, (a) => a === max)
      if (action === 0)
        this.eat()
      if (action === 1 && this.rest < 70)
        return this.sleep()
			if (action === 2)
				this.buy()
			if (action === 3)
				this.work()
    }

    if (recurse) {
      if (this.slow)
        return setTimeout(() => !this.paused && this.update(), 200)
      else {
				return this.update()
			}
    }
  }

  sleep() {
		if (this.rest >= 100) {
			this.rest = 100
			return this.update()
		}
    if (!this.sleepCounter || this.sleepCounter <= 0) {
      this.sleepCounter = 15
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
		if (this.inventory.length > 0) {
			this.food += this.inventory[0].nutrition
			this.inventory.shift()
		} else {
			myNetwork.propagate(learningRate, [this.pain.hunger / 100, this.pain.tired / 100, 1, 1])
		}
		if (this.food > 100) this.food = 100
  }

	work() {
		this.addAction('Work')
		this.money++
		if (this.money > 100) this.money = 100
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
