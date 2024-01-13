# Example Web App using DaisyUi, alpine.js and Codehooks.io

[Read Dev.to tutorial here](https://dev.to/restdbjones/daisyui-alpinejs-codehooksio-the-simple-web-app-trio-4lad)

## Project Setup
Create a project directory for the source code files and initialize npm. Or you can clone this repo and jump to the next section.

```bash
mkdir myproject && cd myproject
mkdir webapp
npm init -y
npm install codehooks-js
```
_Later we'll edit the package.json and add the deployment command for codehooks.io._


Now, create the Web App source files. In the root directory create the two files `index.js`and `buzzwords.js` for the server side code. 

In the 'webapp' directory, create the two files for the client side code `index.html` and `script.js`. The `touch` command is a handy helper.
```bash
touch index.js buzzwords.js webapp/index.html webapp/main.js
```

## Codehooks.io Account Setup

Next you'll need to connect the local project directory to your Codehooks.io project space.

[Sign up for an account](https://account.codehooks.io/login?signup) at Codehooks.io, and create a new project, e.g. mywebapp. 

Install the Codehooks.io CLI.
```bash
npm install -g codehooks
``` 

Login to your account.
```bash
coho login
```

Connect your local web app project with your account/project.
```bash
coho init --empty
```

## Deploy

To deploy the complete web app and the backend API run:

```bash
npm run deploy
```

Check your project URL.

```bash
coho info
```