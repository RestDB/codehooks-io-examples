
/*
* Mailgun example from Codehooks (c).
*/
import {app, Datastore} from 'codehooks-js';
const FormData = require('form-data');
const fetch = require('node-fetch');
import {createWelcomeHTML} from './template';

// Mailgun REST API endpoint address
const MAILGUN_URL = 'api.eu.mailgun.net'; // or api.mailgun.net for US customers

// Send main with Mailgun REST API
function sendOneEmail(emailaddress, name) {
  return new Promise(async (resolve, reject) => {
    try {
      const form = new FormData();
      form.append('from', 'jones@codehooks.io');
      form.append('to', emailaddress);
      form.append('subject', 'Testing Mailgun');
      form.append('html', createWelcomeHTML({ emailaddress, name }));
      const url = `https://${MAILGUN_URL}/v3/${process.env.MAILGUN_DOMAIN}/messages`;
      const credentials = Buffer.from(`api:${process.env.MAILGUN_APIKEY}`).toString('base64');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Basic ${credentials}`
        },
        body: form
      });
      resolve(await resp.json());
    } catch (ex) {
      console.error(ex.message);
      reject(ex.message);
    }
  })
}

// REST API hook
app.post('/email', async (req, res) => {
  const conn = await Datastore.open();
  const job = await conn.enqueue("emailQueue", req.body);
  res.status(200).json({ ...job });
});

// Queue topic listener hook
app.queue('emailQueue', async (req, res) => {
  try {
    console.log("Worker", req.body._id)
    const conn = await Datastore.open();    
    // signal that we are processing emails
    await conn.set('running', new Date().toISOString(), {"ttl": 1000*10,"keyspace": "emailprocess"});
    const { emailaddress, name } = req.body.payload;
    
    const attempt = await conn.updateOne('mailinglist', req.body._id, {$inc: {"attempt": 1}});
    console.log(attempt)
    setTimeout(async () => {
      let reciept = await sendOneEmail(emailaddress, name);
      console.log(reciept);
      await conn.updateOne('mailinglist', req.body._id, {emailSent: new Date().toISOString()});
      res.end();
    }, 1000)
    
  } catch (ex) {
    console.error(ex);
    res.end();
  }
});

// cron job to process unsent emails
app.job('*/10 * * * * *', async (req, res) => {
  try {
    const conn = await Datastore.open();
    // Check key-val store for the running flag
    const isRunning = await conn.get('running', {"keyspace": "emailprocess"});
    // No process is running, start sending new emails
    if (isRunning === null) {
      
      // Add all emails that is not sent to queue
      const job = await conn.enqueueFromQuery('mailinglist', { $or: [{attempt: {$gt: 1, $lt: 3}}, {"attempt": {$exists: false}}] },  'emailQueue');
      if (job.count > 0) console.log("Email process starting", job)
    }
    res.end();
  } catch (ex) {
    console.error(ex);
    res.end();
  }
})

// bind to serverless runtime
export default app.init();
