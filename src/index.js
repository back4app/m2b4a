const prompt = require('./prompt')
const colors = require('colors')

colors.setTheme({
  custom: ['grey']
})

const run = function () {
  return prompt()
}

module.exports = run

if (require.main === module) {
  require('../bin/m2b4a')
}
