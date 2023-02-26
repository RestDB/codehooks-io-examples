# Example app using the open source package codehooks-mongoDB

This repository contains the source code used in [this blog post](https://codehooks.io/blog/build-great-backend-apps-with-open-source-package-codehooks-mongodb)

## Install CLI
```bash
npm install codehooks -g
```

## Usage

Clone the example code repository.
```bash
git clone https://github.com/RestDB/codehooks-io-examples.git
```

Navigate to the example app directory.

```bash
cd codehooks-mongodb/myapp
```

## Install app dependencies

```bash
npm init es6 -y
npm install codehooks-mongodb codehooks-js codehooks-crudlify-yup express body-parser mongodb debug yup --save
```

## Start the server locally

```bash
node app.js
```

## Test the app

Insert a new user record.

```bash
curl -X POST \
  'http://localhost:8080/dev/user' \
  --header 'Content-Type: application/json' \
  --data-raw '{
  "name": "Ally",
  "email": "ally@example.com"
}'
```

Run a query agains the database.

```bash
curl -X GET \
  'http://localhost:8080/dev/user?name=Ally' \
  --header 'Content-Type: application/json' 
```

## Deploy the app to the Codehooks cloud

First create a new Codehooks project to hold the app.
```bash
coho init
```

Next deploy the app to the cloud.

```bash
coho deploy
```

Voilá, you now have a backend app that you can develop and run locally, and at the same time deploy directly to the [codehooks.io](https://codehooks.io) cloud app service.
