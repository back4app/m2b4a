const inquirer = require('inquirer')
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))

const {listApps, createApp, signUp, logIn, getApp, verifyApp, restoreDB, uploadFiles, restartApp, verifyMongorestore, saveCookie, readCookie} = require('./api')

module.exports = async () => {
  let app = null
  let drop = true
  let {cookie, username} = readCookie()
  let useLoggedUser = false
  let login = true

  if (cookie) {
    const {logged} = await inquirer.prompt([{
      type: 'confirm',
      name: 'logged',
      message: `You are already logged with ${username}. Do you want to use this logged user?`
    }])
    useLoggedUser = logged
  }

  if (!useLoggedUser) {
    const {hasAccount, username, password} = await inquirer.prompt([{
      type: 'list',
      name: 'hasAccount',
      message: `Do you have a Back4App account?`,
      choices: ['YES, let me login!', 'NO, let me create a new one!']
    }, {
      type: 'input',
      name: 'username',
      message: `What is your email?`,
      validate: v => !!v
    }, {
      type: 'password',
      name: 'password',
      message: `What is your password?`,
      validate: v => !!v
    }])

    login = hasAccount.indexOf('YES') === 0
    cookie = await (login ? logIn(username, password) : signUp(username, password))
    saveCookie({cookie, username})
  }

  const apps = login && await listApps(cookie)

  if (apps && apps.length > 0) {
    const {override} = await inquirer.prompt([{
      type: 'list',
      name: 'override',
      message: `We found some apps in your account! Would you like to use one of them?`,
      choices: ['YES, I want to update one of them!', 'NO, create a new one!']
    }])
    if (override.indexOf('YES') === 0) {
      const {selectedAppChoice, dropChoice} = await inquirer.prompt([{
        type: 'list',
        name: 'selectedAppChoice',
        pageSize: 100,
        message: `Choose an app:`,
        choices: apps.map(a => `${a.appName}: appId: ${a.appId}`)
      }, {
        type: 'list',
        name: 'dropChoice',
        message: `Would you like to erase all data before import it?`,
        choices: [`YES! This is my first import or I know the risks`, 'NO! Only insert new ids']
      }])
      const appId = selectedAppChoice.split('appId: ').pop()
      const id = apps.find(a => a.appId === appId).id
      app = await getApp(id)
      drop = dropChoice.indexOf('YES') === 0
    }
  }


  if (!app) {
    const {appName} = await inquirer.prompt([{
      type: 'input',
      name: 'appName',
      pageSize: 100,
      message: `Tell me a good app name:`,
      validation: v => !!v
    }])
    app = await createApp(appName)
  }

  await verifyApp(app)

  const {dumpPath, hasFiles} = await inquirer.prompt([{
    type: 'fuzzypath',
    name: 'dumpPath',
    excludePath: path => path.indexOf('node_modules') !== -1,
    itemType: 'directory',
    message: `Where are the dumped mongodb files (you can search or just copy and paste it here)?`
  }, {
    type: 'confirm',
    name: 'hasFiles',
    message: `Do you have files to upload?`
  }])

  if (hasFiles) {
    let {filesPath} = await inquirer.prompt([{
      type: 'fuzzypath',
      name: 'filesPath',
      excludePath: path => path.indexOf('node_modules') !== -1,
      itemType: 'directory',
      message: `Where are the files (you can search the path or just copy and paste it here)?`
    }])
    await uploadFiles(app, filesPath)
  }

  await verifyMongorestore()

  await restoreDB(app.databaseURL, dumpPath, drop)

  await restartApp(app)

  await verifyApp(app)


  console.log(`
  Your app was successfully migrated to Back4App

  You can now access your app at: `.green + `https://parse-dashboard.back4app.com/apps/${app.id}`.cyan + `
  
  You now need to change your frontend code to connect to your new app, test it, and deploy the new version of your app to the stores
  
  Please find your app credentials below:`.green + `
  Server URL: ${'https://parseapi.back4app.com'.cyan}` + `
  Application Id: ${app.appId.cyan}
  Master Key: ${app.masterKey.cyan}
  Client Key: ${app.clientKey.cyan}
  Javascript Key: ${app.javascriptKey.cyan}
  REST Key: ${app.restKey.cyan}
  .NET Key: ${app.dotnetKey.cyan}
  Webhook Key: ${app.webhookKey.cyan}
  MongoURI: ${app.databaseURL.cyan}
  ` + `
  You can always have access to these credentials at: `.green + `https://parse-dashboard.back4app.com/apps/${app.id}/settings/keys`.cyan + `
  
  For additional information about the next steps, please check: `.green + 'https://www.npmjs.com/package/@back4app/m2b4a'.cyan
  )

}
