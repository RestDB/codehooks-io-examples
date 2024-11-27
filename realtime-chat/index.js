
/*
* Codehooks.io - Chat example
*/

import { app, realtime } from 'codehooks-js';

// create a real-time channel
realtime.createChannel('/chat');


app.auth("/*", (req, res, next) => {
  console.log('No auth today', req.path)
  next()
});

// client connects for a new real-time listener ID
app.post('/connect', async (req, res) => {
  const listenerData = await realtime.createListener('/chat')
  // return listener ID to client
  res.json({ listenerID: listenerData._id })
})

// client post a new message
app.post('/messages', async (req, res) => {
  console.log('Message in', req.body)
  const { message, listenerID, alias } = req.body;
  const data = await realtime.publishEvent('/chat', { "message": `${alias || 'Anonymous'}: ${message}` });
  res.end(data)
})

app.static({ route: '/public', directory: '/public' })

// bind to serverless runtime
export default app.init();
