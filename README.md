# m2b4a - migrate-to-back4app
Command-line-interface (CLI) for migrating an existing app to Back4App: https://www.npmjs.com/package/@back4app/m2b4a

## 1 - Requirements

### 1.1 - Install Node.js (>= 10.10) and npm
If you don't have Node.js or npm installed in your machine, please take a look in this link: https://www.npmjs.com/get-npm

### 1.2 - Install MongoDB
If you don't have MongoDB installed in your machine, please take a look in this link: https://docs.mongodb.com/manual/installation/

## 2 - Install @back4app/m2b4a
```
npm install -g @back4app/m2b4a
```

## 3 - Migrating from Buddy?
This is an optional step only for users migrating from Buddy.
1. Access https://parse.buddy.com/
1. Select the app you want to migrate
1. Click in App Settings
1. Click in Export database option
1. Wait for an e-mail with your data
1. Unzip the data file you received and take note of the folder path in which you extracted its content (it is your "dump-path" and you will need it in the next step and in 5 - Execute the migrate command)
1. Open a terminal and go to the folder you extracted your Buddy data
1. Download your files in a subfolder (take not of this subfolder path because it is your "files-path" and you will need it in 5 - Execute the migrate command):
```
mkdir files
cd files
xargs -n 1 curl -O < ../fileList.txt
```

## 4 - Sign up to Back4App
Go to https://www.back4app.com and sign up.

## 5 - Execute the migrate command
```
migrate-to-back4app --username <username> --password <password> --app-name <app-name> --dump-path <dump-path> [--files-path <files-path>]
```
Option | Description | Required
--- | --- | ---
username | Your Back4App username (e-mail) | Yes
password | Your Back4App password | Yes
app-name | Your app name | Yes
dump-path | The path to your mongo db dump folder | Yes
files-path | The path to your files folder | No

When the migration is finalized, you will receive a confirmation message with all your app credentials, including your new MongoDB database URI.

## 6 - Connect your current API to your new MongoDB database at Back4App
Now it is time to update your current API to use the new MongoDB database at Back4App so you can make sure that your current users will start reading and writing from/to Back4App. Use the URI that was printed in the end of the last step command execution.

*If you are migrating from Buddy, you can use the "Set external URL" option in Buddy Dashboard.*

## 7 - Connect your frontend code to Back4App
Now you need to change your frontend code to connect to Back4App API (https://parseapi.back4app.com) and use your new credentials what were printed in the step 4.

## 8 - Test your app and deploy the new versions to the store
That's the final step and once you have concluded it, your app is safe at Back4App!

## 9 - Getting help
If you need any assistance, please open a ticket at https://www.back4app.com or schedule an appointment with our engineering team using this link: https://calendly.com/back4app/
