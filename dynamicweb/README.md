# Dynamic web pages example
This example show how to create a dynamic web site using Handlebars, TailwindCSS, DaisyUi and a Codehooks serverless backend.
## Install

Install CLI

`npm i -g codehooks`

Download example code

`git clone https://github.com/RestDB/codehooks-io-examples.git`

Change directory

`cd codehooks-io-examples/dynamicweb`

Connect to your project that you've created in Studio

`coho init --empty`

Add dependencies

`npm install`

## Deploy

`npm run deploy`

## Import data

Import example product data to the database

`coho import -f exampledata/products.json -c products`

Check in Studio or with the CLI.

`coho query products`

## Usage

Visit the project URL `coho info` will show yours.

Live example here:
[https://dynamicweb-h2pl.api.codehooks.io/dev](https://dynamicweb-h2pl.api.codehooks.io/dev)
