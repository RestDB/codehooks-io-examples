/*
* Auto CRUD example using yup schema
*/
import app from 'codehooks-js'
import crudlify from 'codehooks-crudlify'
import * as yup from 'yup';

import {customer, product} from './schema'
//import {middleware} from './middleware'

// apply middleware
//app.use(middleware)

app.use((req, res, next) => {    
  if (req.method === 'POST' && req.params.collection === 'customer') {
      if (req.body.products) {
          req.body.balance = req.body.products.reduce((accumulator, object) => {
              return accumulator + object.price;
          }, 0);
      }
  }
  next()
})

app.get('/test/:key', async (req, res) => {
  console.log(req)
  const { key } = req.params;
  const conn = await Datastore.open();
  const kval = await conn.get(key);
  console.log("key-val", kval);
  res.json(kval)
})

// Add CRUD routes with yup schema
crudlify(app, {customer, product})

// bind to serverless runtime
export default app.init()