/* 
* app.js
* Example express app for running codehooks.io standalone using MongoDB
*/
import express from 'express';
import bodyParser from 'body-parser';
import mongoStore from 'codehooks-mongodb';
import codehooks from './index.js';

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const options = {
    "datastore": new mongoStore('mongodb://localhost:27017')
}

// important, make codehooks use express and MongoDB
codehooks.useExpress(app, options);

const server = app.listen(8080, () => {
    console.log('Listening on port:', server.address().port);
});