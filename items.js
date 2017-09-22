class Food {
  constructor(nutrition, cost, name) {
    this.nutrition = nutrition
    this.cost = cost
    this.name = name
  }
}

class Apple extends Food {
  constructor() {
    super(20, 10, 'Apple')
  }
}

module.exports = { Apple }
