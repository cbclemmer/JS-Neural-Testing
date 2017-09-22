const synaptic = require('synaptic')
const Layer = synaptic.Layer
const	Network = synaptic.Network

/*
INPUTS: (stats)
hunger
thirst
rest
money
OUTPUTS: (Actions)
Eat
Drink
Sleep
Buy
Work
*/

const inputLayer = new Layer(4)
const hiddenLayer = new Layer(20)
const outputLayer = new Layer(5)

inputLayer.project(hiddenLayer)
hiddenLayer.project(outputLayer)

myNetwork = new Network({
  input: inputLayer,
  hidden: [hiddenLayer],
  output: outputLayer
})

module.exports = myNetwork
