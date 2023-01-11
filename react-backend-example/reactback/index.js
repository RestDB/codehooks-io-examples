// React backend example app
import {app, Datastore} from 'codehooks-js'

// REST API
app.get('/hello', async (req, res) => {
  const db = await Datastore.open();
  // increment visit counter in key-value database
  const visits  = await db.incr('hits', 1);
  res.json({"message": "Hello React world!", "visits": visits});
});

// bind to serverless runtime
export default app.init();
