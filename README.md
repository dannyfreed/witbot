## How to get up and running
1. Make sure you have node and npm installed
2. clone repo
3. create a file called `devenv.sh`
4. create a slack bot here (this will be your local testing bot): https://dannysbottester.slack.com/apps/new/A0F7YS25R-bots
5. copy API token
6. Paste API token into the ```devenv.sh1``` file like so: `export SLACK_TOKEN=PASTE_TOKEN_HERE`
7. Below that, paste the rest of the stuff from the file I will send you via Slack (Google analytics Service Email, Pem Key, Wit Token, Weather Token (we'll remove this one soon))
8. in terminal, type `npm install --save` this installs all the npm packages
9. in terminal, type `npm start` this runs the command to run the index.js file
