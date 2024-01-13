/*
* Codehooks.io backend example app
*/
import {app, datastore} from 'codehooks-js'
import { buzzwords1, buzzwords2, buzzwords3 } from './buzzwords';


function generateBS() {
  const word1 = buzzwords1[Math.floor(Math.random() * buzzwords1.length)];
  const word2 = buzzwords2[Math.floor(Math.random() * buzzwords2.length)];
  const word3 = buzzwords3[Math.floor(Math.random() * buzzwords3.length)];

  return `${word1} ${word2} ${word3}`;
}

// allow api access without api token
app.auth('/api/message*', (req, res, next) => {
  if (req.method === 'GET') {
    next();
  } else {
    next('Only GET is allow public access');
  }
})

// api route for generating a bullshit message and a count
app.get('/api/message', async (req, res) => {
  const db = await datastore.open();
  const bsCount = await db.incr('bsCount', 1)
  console.log('Count', bsCount)
  res.json({bsCount, message: generateBS()})
})

// serve the webapp directory on the / route
app.static({route: "/", directory: "/webapp"})

// bind to serverless runtime
export default app.init();