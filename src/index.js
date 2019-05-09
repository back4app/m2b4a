const prompt = require('./prompt')
const colors = require('colors')

colors.setTheme({
  custom: ['grey']
})

module.exports = async function run () {

  await prompt().catch(err => {
    console.log('\n\nOoops... Something got wrong!\nPlease open a ticket at: https://www.back4app.com\n\n'.red.bold)
    console.error(err.message || err)
    console.error(err.stack)
  })

}

