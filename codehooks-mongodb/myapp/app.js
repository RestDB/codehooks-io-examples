/* 
* standalone.js
* Example express app for running codehooks.io standalone using MongoDB
*/
import codehooks from './index.js';
import mongoStore from 'codehooks-mongodb';
import express from 'express';
import bodyParser from 'body-parser';
const app = express();

app.use(bodyParser.json({ limit: '10mb' }));

const options = {
    "datastore": new mongoStore('mongodb://localhost:27017')
}

// important, make codehooks use express and MongoDB
codehooks.app.useExpress(app, options);

const server = app.listen(8080, () => {
    console.log('Listening on port:', server.address().port);
  });