const _ = require('lodash')
const { Apple } = require('./items')

class Bot {
  constructor(network, render, id = 0, gui = false) {
    _.extend(this, { id, network, render, gui})
    this.learningRate = .3
    this.food = 100
    this.hydration = 100
    this.rest = 100
    this.alive = 1
    this.turnsAlive = 0
    this.actionNumber = 0
    this.actions = []
    this.currentAction = ''
    this.pain = {
      hunger: 0,
      thirst: 0,
      tired: 0
    }
    this.inventory = [new Apple(), new Apple(), new Apple(), new Apple(), new Apple()]
    this.money = 10
    this.paint()
    this.update()
  }

  buy() {
    if (this.money < 10)
      return this.network.propagate(this.learningRate, [
        this.pain.hunger / 100,
        this.pain.thirst / 100,
        this.pain.tired / 100,
        0, // don't buy if you don't have the money
        1 // Work for your monoy
      ])
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
    var actions = ['Eat', 'Drink', 'Sleep', 'Buy', 'Work']

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
    if (!this.gui) return
    this.render(`
${this.paused ? 'PAUSED\n' : ''}
${this.sleeping ? 'SLEEPING\n' : ''}
ID: ${this.id}
Status: ${this.alive === 1 ? 'Alive' : 'Dead'}
Time Alive: ${this.turnsAlive}
Food: ${this.food}
Hydration: ${this.hydration}
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

  dead() {
    this.alive = 0
    const lesson = [
      Math.abs((this.food / 100) - 1), // Eat when food is low
      Math.abs((this.hydration / 100) - 1), // Drink when you are thirsty
      Math.abs((this.rest / 100 - 1)), // Sleep when rest is low
      Math.abs(this.money / 100), // Buy when you have lots of money
      Math.abs(this.money / 100 - 1) // Work when you have little money
    ]
    this.network.propagate(this.learningRate, lesson)
    this.paint()
    return
  }

  updatePain() {
    this.pain = {
      hunger: Math.abs(this.food - 100),
      thirst: Math.abs(this.hydration - 100),
      tired: Math.abs(this.rest - 100)
    }
    if (this.pain.huger > 30 || this.pain.thirst > 30 || this.pain.tired > 30) {
      this.network.propagate(this.learningRate, [
        this.pain.hunger / 100,
        this.pain.thirst / 100,
        this.pain.tired / 100,
        Math.abs(this.money / 100 ),
        Math.abs(this.money / 100 - 1)
      ])
    }
  }

  update(recurse = true, act = true) {
    this.turnsAlive++
    this.food--
    this.hydration--
    this.rest--

    if (this.food <= 0 || this.hydration <= 0  || this.rest <= 0) return this.dead()
    this.updatePain()

    this.paint()

    if (act) {
      this.sleeping = false
      var stats = [this.food / 100, this.hydration / 100, this.rest / 100, this.money / 100]
      var actions = this.network.activate(stats)
      this.currentAction = actions
      const max = _.max(actions)
      var action = _.findIndex(actions, (a) => a === max)
      switch (action) {
      case 0:
        this.eat()
        break
      case 1:
        this.drink()
        break
      case 2:
        return this.sleep()
      case 3:
        this.buy()
        break
      case 4:
        this.work()
        break
      }
    }

    if (recurse) {
      if (this.gui)
        return setTimeout(() => !this.paused && this.update(), 200)
      else {
        return this.update()
      }
    }
  }

  sleep() {
    if (this.rest > 70)
      return this.update()
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
    else this.gui ? setTimeout(() => this.sleep(), 200) : this.sleep()
  }

  eat() {
    this.addAction('Eat')
    if (this.inventory.length > 0) {
      this.food += this.inventory[0].nutrition
      this.inventory.shift()
    } else {
      this.network.propagate(this.learningRate, [this.pain.hunger / 100, this.pain.thirst / 100, this.pain.tired / 100, 1, .5])
    }
    if (this.food > 100) this.food = 100
  }

  drink() {
    this.addAction('Drink')
    this.hydration +=  20
    if (this.hydration > 100) this.hydration = 100
  }

  work() {
    this.addAction('Work')
    this.money++
    if (this.money > 100) this.money = 100
  }
}

module.exports = Bot
