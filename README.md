# m2b4a - migrate-to-back4app
Command-line-interface (CLI) for migrating an existing app to Back4App: https://www.npmjs.com/package/@back4app/m2b4a

## 1 - Install Node.js (>= 8) and npm

If you don't have Node.js or npm installed in your machine, please take a look in this link: https://www.npmjs.com/get-npm

## 2 - Install @back4app/m2b4a
```
npm install -g @back4app/m2b4a
```

## 3 - Execute the migrate command
```
migrate-to-back4app
```

When the migration is finalized, you will receive a confirmation message with all your app credentials, including your new MongoDB database URI.

## 4 - Connect your current API to your new MongoDB database at Back4App
Now it is time to update your current API to use the new MongoDB database at Back4App so you can make sure that your current users will start reading and writing from/to Back4App. Use the URI that was printed in the end of the last step command execution.

## 5 - Connect your frontend code to Back4App
Now you need to change your frontend code to connect to Back4App API (https://parseapi.back4app.com) and use your new credentials what were printed in the step 4.

## 6 - Test your app and deploy the new versions to the store
That's the final step and once you have concluded it, your app is safe at Back4App!

## 7 - Optional: Import your cloud code using our CLI

### Important:
1. TIP: Use our CLI to upload your cloud code: https://www.back4app.com/docs/platform/command-line-interface 
2. TIP: Use the command 'b4a new' to download the directory structure to paste your cloud code files and 'b4a deploy' to upload them to your app.
3. Back4App uses 2 main folders: "public/" to public files, like htmls, css, etc. and "cloud/" to private cloud code.
4. Inside "cloud/" Back4App import 2 files. One named "app.js" for your custom api (app.get('/my-custom-api') for ex.) and "main.js" for Parse.Cloud functions and jobs  
5. __VERY IMPORTANT!__ "app" (the express.js instance) and "Parse" variables are global. Don't install them on your package.json or require them in your cloud code (_don't use require('express') or require('parse/node'), just use app and Parse variables_).

## 8 - Getting help
If you need any assistance, please open a ticket at https://www.back4app.com or schedule an appointment with our engineering team using this link: 
https://calendly.com/alysson/one-o-one

