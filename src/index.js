const prompt = require('./prompt')
const colors = require('colors')

const pjson = require('../package.json');
console.log(`\nBack4App Migration Tool Version ${pjson.version.yellow}\n`.blue.bold);

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
