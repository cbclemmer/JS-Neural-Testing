const blessed = require('blessed')

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

escBox = blessed.box({
  top: '0%',
  left: '0%',
  width: '50%',
  height: '10%',
  content: 'Press esc to exit',
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
screen.append(escBox)
box.focus()

module.exports = { box, screen }
