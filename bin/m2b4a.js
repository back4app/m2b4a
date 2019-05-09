#!/usr/bin/env node

var check = require('check-node-version')

check(
  {node: '>= 8'},
  (error, results) => {
    if (error) {
      console.error('Wrong nodejs version. Your nodejs version should be greater than 8.0')
      return
    }

    if (results.isSatisfied) {
      require('../src')().then(() => {
        process.exit(0)
      }).catch(err => {
        console.log('\n\nOoops... Something got wrong!\nIf you have this error again open a ticket at: https://www.back4app.com\n\n'.red.bold)
        console.error(err.message || err)
        console.error(err.stack || '')
        process.exit(1)
      })
      return
    }

    console.error('Some package version(s) failed!')

    for (const packageName of Object.keys(results.versions)) {
      if (!results.versions[packageName].isSatisfied) {
        console.error(`Missing ${packageName}.`)
      }
    }
  }
)
