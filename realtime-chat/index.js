
/*
* Codehooks.io - Chat example
*/

import {app, realtime} from 'codehooks-js';

// create a real-time channel
realtime.createChannel('/chat');

// client connects for a new real-time listener ID
app.post('/connect', async (req, res) => {
  const listenerData = await realtime.createListener('/chat')
  // return listener ID to client
  res.json({listenerID: listenerData._id})
})

// client post a new message
app.post('/messages', async (req, res) => {
  const {message, listenerID} = req.body;
  const data = await realtime.publishEvent('/chat', {"message": `${listenerID}: ${message}`});
  res.end(data)
})

app.static({route:'/public', directory: '/public'})

// bind to serverless runtime
export default app.init();
