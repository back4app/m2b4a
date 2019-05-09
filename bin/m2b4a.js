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
      require('../src')()
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
