const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const request = require('request');
const yargs = require('yargs');
const os = require('os');
const inquirer = require('inquirer');

module.exports = async function run() {
  const {
    username,
    password,
    appName,
    dumpPath,
    filesPath
  } = yargs
  .usage('migrate-to-back4app --username <username> --password <password> --app-name <app-name> --dump-path <dump-path> [--files-path <files-path>]')
  .option(
    'u',
    {
      alias: 'username',
      describe: 'Your Back4App username (e-mail)',
      type: 'string',
      demandOption: true
    }
  )
  .option(
    'p',
    {
      alias: 'password',
      describe: 'Your Back4App password',
      type: 'string',
      demandOption: true
    }
  )
  .option(
    'a',
    {
      alias: 'app-name',
      describe: 'Your app name',
      type: 'string',
      demandOption: true
    }
  )
  .option(
    'd',
    {
      alias: 'dump-path',
      describe: 'The path to your mongo db dump folder',
      type: 'string',
      demandOption: true
    }
  )
  .option(
    'f',
    {
      alias: 'files-path',
      describe: 'The path to your files folder',
      type: 'string',
      demandOption: false
    }
  )
  .help()
  .argv;

  console.log('Verifying mongorestore installation...');
  try {
    await verifyMongorestore();
  } catch (e) {
    console.log('Failed to verify mongorestore installation');
    if (e) {
      console.log(e.message || e);
    }
    console.log('This CLI requires mongorestore to be installed');
    console.log('Please install MongoDB: https://docs.mongodb.com/manual/installation/');
    return;
  }

  console.log();

  console.log('Logging in Back4App...');
  let cookie = null;
  try {
    cookie = await logIn(username, password);
  } catch (e) {
    console.log('Failed to log in Back4App');
    if (e) {
      console.log(e.message || e);
    }
    return;
  }

  console.log();

  console.log('Listing apps...');
  let apps = null;
  let app = null;
  try {
    apps = await listApps(cookie);
    if (apps.length > 0) {
      const appFound = apps.find(a => a.appName === appName)
      if (appFound) {
        const answers = await inquirer.prompt([{
          type: 'list',
          name: 'override',
          message: `We found an app named "${appName}"! Would you like to override the data?`,
          choices: ['YES! Delete this app data and import it again', `NO! Create a new app with the same name: ${appName}`]
        }])
        const override = answers.override.indexOf('YES') === 0
        if (override) {
          app = await getApp(cookie, appFound.id)
        }
      }
    }
  } catch (e) {
    console.log('Failed to check your apps on Back4App');
    if (e) {
      console.log(e.message || e);
    }
    return;
  }

  if (!app) {
    console.log('Creating a new app at Back4App...');
    try {
      app = await createApp(cookie, appName);
    } catch (e) {
      console.log('Failed to create a new app at Back4App');
      if (e) {
        console.log(e.message || e);
      }
      return;
    }
  }

  console.log();

  console.log('Verifying the new app...');
  try {
    await verifyApp(app);
  } catch (e) {
    console.log('Failed to verify the new app');
    if (e) {
      console.log(e.message || e);
    }
    return;
  }

  console.log();

  console.log('Restoring mongo db dump to the new app at Back4App...');
  try {
    await restoreDB(app.databaseURL, dumpPath);
  } catch (e) {
    console.log('Failed to restore mongo db dump to the new app at Back4App');
    if (e) {
      console.log(e.message || e);
    }
    return;
  }

  if (filesPath) {
    console.log();

    console.log('Uploading files to the new app at Back4App...');
    try {
      await uploadFiles(app, filesPath);
    } catch (e) {
      console.log('Failed to upload files to the new app at Back4App');
      if (e) {
        console.log(e.message || e);
      }
      return;
    }
  }

  console.log();

  console.log('Restarting the new app...');
  try {
    await restartApp(cookie, app);
  } catch (e) {
    console.log('Failed to restart the new app');
    if (e) {
      console.log(e.message || e);
    }
    console.log();
    console.log('Please open a ticket at: https://www.back4app.com');
    console.log(`Inform your app id: ${app.appId}`);
    return;
  }

  console.log();

  console.log('Verifying the new app again...');
  try {
    await verifyApp(app);
  } catch (e) {
    console.log('Failed to verify the new app again');
    if (e) {
      console.log(e.message || e);
    }
    console.log();
    console.log('Please open a ticket at: https://www.back4app.com');
    console.log(`Inform your app id: ${app.appId}`);
    return;
  }

  console.log();

  console.log('Your app was successfully migrated to Back4App');
  console.log();
  console.log(`You can now access your app at: https://parse-dashboard.back4app.com/apps/${app.id}`);
  console.log();
  console.log('You now need to change your frontend code to connect to your new app, test it, and deploy the new version of your app to the stores');
  console.log();
  console.log('Please find your app credentials below:');
  console.log('Server URL: https://parseapi.back4app.com');
  console.log(`Application Id: ${app.appId}`);
  console.log(`Master Key: ${app.masterKey}`);
  console.log(`Client Key: ${app.clientKey}`);
  console.log(`Javascript Key: ${app.javascriptKey}`);
  console.log(`REST Key: ${app.restKey}`);
  console.log(`.NET Key: ${app.dotnetKey}`);
  console.log(`Webhook Key: ${app.webhookKey}`);
  console.log(`You can always have access to these credentials at: https://parse-dashboard.back4app.com/apps/${app.id}/settings/keys`);
  console.log();
  console.log('For additional information about the next steps, please check: https://www.npmjs.com/package/@back4app/m2b4a');
};

function verifyMongorestore() {
  return new Promise((resolve, reject) => {
    exec(
      'mongorestore --version',
      error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

function logIn(username, password) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: 'https://dashboard.back4app.com/login',
        method: 'POST',
        json: true,
        body: {
          username,
          password
        }
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode !== 200) {
          reject(body);
        } else {
          resolve(response.headers['set-cookie']);
        }
      }
    );
  });
}

function createApp(cookie, appName) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: 'https://dashboard.back4app.com/create-parse-app',
        method: 'POST',
        headers: {
          cookie
        },
        json: true,
        body: {
          appName
        }
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode !== 200) {
          reject(body);
        } else {
          resolve(body);
        }
      }
    );
  });
}

function listApps(cookie) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: 'https://dashboard.back4app.com/listApps',
        method: 'GET',
        headers: {
          cookie
        },
        json: true
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode !== 200) {
          reject(body);
        } else {
          resolve(body);
        }
      }
    );
  });
}

function getApp(cookie, id) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://dashboard.back4app.com/parse-app/${id}`,
        method: 'GET',
        headers: {
          cookie
        },
        json: true
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode !== 200) {
          reject(body);
        } else {
          resolve(body);
        }
      }
    );
  });
}

function verifyApp(app) {
  return new Promise((resolve, reject) => {
    let attempts = 5;

    verify();

    function verify() {
      request(
        {
          url: 'https://parseapi.back4app.com/serverInfo',
          method: 'GET',
          headers: {
            'X-Parse-Application-Id': app.appId,
            'X-Parse-Master-Key': app.masterKey
          }
        },
        (error, response, body) => {
          if (error) {
            fail(error);
          } else if (response.statusCode !== 200) {
            fail(body);
          } else {
            resolve();
          }
        }
      );
    }

    function fail(error) {
      attempts--;
      if (attempts > 0) {
        setTimeout(verify, 1000);
      } else {
        reject(error);
      }
    }
  });
}

function restoreDB(databaseURL, dumpPath) {

  // console.log(`Restoring your data on ${databaseURL}`)

  const platform = os.platform()
  const binay = path.join(__dirname, '../mongorestore', platform, 'mongorestore')

  databaseURL = databaseURL.split('://')[1];
  const password = databaseURL.split(':')[1].split('@')[0];
  const db = databaseURL.split('/')[1];
  return new Promise((resolve, reject) => {
    const mongorestore = spawn(
      binay,
      [
        '--username', 'admin',
        '--password', password,
        '--host', 'mongodb.back4app.com',
        '--port', '27017',
        '--db', db,
        '--authenticationDatabase', db,
        '--drop',
        '--noIndexRestore',
        '--stopOnError',
        dumpPath
      ]
    );

    mongorestore.stdout.on('data', data => console.log(data.toString()));

    mongorestore.stderr.on('data', data => console.error(data.toString()));

    mongorestore.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Mongorestore exited with code: ${code}`);
      }
    });
  });
}

async function uploadFiles(app, filesPath) {
  const fileNames = fs.readdirSync(filesPath);
  for (let i = 0; i < fileNames.length; i++) {
    const fileName = fileNames[i];
    const filePath = path.resolve(filesPath, fileName);
    if (fs.lstatSync(filePath).isFile()) {
      const data = fs.readFileSync(filePath);
      await uploadFile(fileName, data);
    }
  }

  async function uploadFile(fileName, data) {
    return new Promise((resolve, reject) => {
      console.log(`Uploading ${fileName}`);

      let attempts = 5;

      upload();

      function upload() {
        request(
          {
            url: 'http://s3proxy.back4app.com/uploadFile',
            method: 'POST',
            headers: {
              'X-Parse-Application-Id': app.appId,
              'X-Parse-Master-Key': app.masterKey
            },
            formData: {
              upload: {
                value: data,
                options: {
                  filename: fileName
                }
              }
            }
          },
          (error, response, body) => {
            if (error) {
              fail(error);
            } else if (response.statusCode !== 200) {
              fail(body);
            } else {
              resolve();
            }
          }
        );
      }

      function fail(error) {
        attempts--;
        if (attempts > 0) {
          setTimeout(upload, 1000);
        } else {
          reject(error);
        }
      }
    });
  }
}

function restartApp(cookie, app) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://dashboard.back4app.com/parse-app/${app.id}/restart`,
        method: 'POST',
        headers: {
          cookie
        }
      },
      (error, response, body) => {
        if (error) {
          reject(error);
        } else if (response.statusCode !== 200) {
          reject(body);
        } else {
          resolve(body);
        }
      }
    );
  });
}
