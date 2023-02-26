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

## Deploy the app to the Codehooks cloud

First create a new Codehooks project to hold the app.
```bash
coho init
```

Next deploy the app to the cloud.

```bash
coho deploy
```
