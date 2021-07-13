const { exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const axios = require('axios')
const { promisify } = require('util')
const execAsync = promisify(exec)
const sleep = require('sleep-promise')
const homedir = os.homedir()
const FormData = require('form-data')

const util = require('util');
const execTest = util.promisify(require('child_process').exec);

let _cookie = null
const process = require('child_process');

process.exec('uname -p', function (err, stdout, stderr) {
  if (err) {
    console.log(stderr);
  } else {
    let platform = stdout.replace(/\n|\r/g, "")
    mongorestore = path.join(__dirname, '../mongodb', `${platform}`, 'mongorestore')
  }
});

const cookiePath = path.join(homedir, '.b4acookie')
let mongorestore = null
//console.log('olhaa mongorestore ', mongorestore)

function verifyMongoRestore() {
  return execAsync(`${mongorestore} --version`)
}

async function logIn(username, password) {
  console.log('Logging on Back4App...'.gray)
  const response = await axios.post('https://dashboard.back4app.com/login', { username, password }).catch(err => {
    if (err.response.status === 401) {
      return Promise.reject(`Wrong username or password. Wait 1 minute and try again`)
    }
    return Promise.reject(err)
  })
  _cookie = response.headers['set-cookie']
  return _cookie
}

async function signUp(username, password) {
  console.log('Signing up on Back4App...'.gray)
  const response = await axios.post('https://dashboard.back4app.com/signup', { username, password })
  _cookie = response.headers['set-cookie']
  return _cookie
}

async function createApp(appName, cookie = _cookie, appDescription = 'Created using m2b4a') {
  console.log('Creating a new app...'.gray)
  const response = await axios.post('https://dashboard.back4app.com/create-parse-app', { appName, appDescription }, { headers: { cookie } })
  return response.data
}

async function listApps(cookie = _cookie) {
  console.log('Listing your apps...'.gray)
  const response = await axios.get('https://dashboard.back4app.com/listApps', { headers: { cookie } })
  return response.data
}

async function getApp(id, cookie = _cookie) {
  console.log('Getting app details...'.gray)
  const response = await axios.get(`https://dashboard.back4app.com/parse-app/${id}`, { headers: { cookie } })
  return response.data
}

async function verifyApp(app, attempt = 5) {
  try {
    console.log('Verifying your app...'.gray)
    await axios.get('https://parseapi.back4app.com/serverInfo', {
      headers: {
        'X-Parse-Application-Id': app.appId,
        'X-Parse-Master-Key': app.masterKey
      }
    })
  } catch (err) {
    if (attempt <= 0) return Promise.reject(err)
    await sleep(10000)
    attempt--
    return verifyApp(app, attempt)
  }
}

function restoreDB(databaseURL, dumpPath, drop = true) {
  if (dumpPath.startsWith('~')) dumpPath = dumpPath.replace('~', os.homedir())
  console.log('Restoring your database...'.gray)
  databaseURL = databaseURL.split('://')[1]
  const password = databaseURL.split(':')[1].split('@')[0]
  const host = databaseURL.split('@')[1].split(':')[0]
  const db = databaseURL.split('/')[1]
  const options = [
    '--username', 'admin',
    '--password', password,
    '--host', host,
    '--port', '27017',
    '--db', db,
    '--authenticationDatabase', db,
    '--noIndexRestore',
    '--writeConcern', "{w:0}",
    dumpPath
  ]
  if (drop) options.push('--drop')
  return new Promise((resolve, reject) => {
    const mongorestoreCmd = spawn(mongorestore, options)

    mongorestoreCmd.stdout.on('data', data => console.log(data.toString().grey))

    mongorestoreCmd.stderr.on('data', data => console.log(data.toString().grey))

    mongorestoreCmd.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Mongorestore exited with code: ${code}`)
      }
    })
  })
}

async function uploadFiles(app, filesPath) {
  if (filesPath.startsWith('~')) filesPath = filesPath.replace('~', os.homedir())
  console.log('Uploading your files...'.gray)
  const fileNames = fs.readdirSync(filesPath)
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i]
    const filePath = path.resolve(filesPath, fileName)
    if (fs.lstatSync(filePath).isFile()) {
      const data = fs.createReadStream(filePath)
      await uploadFile(fileName, data)
    }
  }

  async function uploadFile(filename, stream, attempt = 5) {
    console.log(`Uploading ${filename}...`.gray)
    let form = new FormData()
    form.append('upload', stream, { filename })

    const headers = form.getHeaders()
    headers['X-Parse-Application-Id'] = app.appId
    headers['X-Parse-Master-Key'] = app.masterKey
    try {
      await axios.post('http://s3proxy.back4app.com/uploadFile', form, { headers })
    } catch (err) {
      if (attempt <= 0) return Promise.reject(err)
      await sleep(1000)
      attempt--
      await uploadFile(filename, stream, attempt)
    }
  }
}

async function restartApp(app, cookie = _cookie) {
  console.log('Restarting your app...'.gray)
  const response = await axios.post(`https://dashboard.back4app.com/parse-app/${app.id}/restart`, null, { headers: { cookie } })
  return response.data
}

function saveCookie({ cookie = _cookie, username }) {
  fs.writeFileSync(cookiePath, JSON.stringify({ cookie, username }))
}

function readCookie() {
  try {
    let storedCookie = JSON.parse(fs.readFileSync(cookiePath))
    if (storedCookie) _cookie = storedCookie.cookie
    return storedCookie
  } catch (e) {
    return {}
  }
}

function deleteCookie() {
  try {
    fs.unlinkSync(cookiePath)
  } catch (e) {
  }
}

module.exports = {
  verifyMongoRestore,
  logIn,
  signUp,
  createApp,
  listApps,
  getApp,
  verifyApp,
  restartApp,
  restoreDB,
  uploadFiles,
  saveCookie,
  readCookie,
  deleteCookie
}
