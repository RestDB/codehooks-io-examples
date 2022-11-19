
/*
* Mailgun example from Codehooks (c).
*/
import {app, Datastore} from 'codehooks-js';
import FormData from 'form-data';
import fetch from 'node-fetch';
import {createWelcomeHTML} from './template';

// Mailgun REST API endpoint address
const MAILGUN_URL = 'api.eu.mailgun.net'; // or api.mailgun.net for US customers

// Send mail with Mailgun REST API
async function sendOneEmail(emailaddress, name) {
      // create an email as form data
      const form = new FormData();
      form.append('from', 'james@example.com');
      form.append('to', emailaddress);
      form.append('subject', 'Testing Mailgun with Codehooks');
      form.append('html', createWelcomeHTML({ emailaddress, name }));
      // Mailgun api endpoint
      const url = `https://${MAILGUN_URL}/v3/${process.env.MAILGUN_DOMAIN}/messages`;
      // Mailgun credentials must be base64 encoded for Basic authentication
      const credentials = Buffer.from(`api:${process.env.MAILGUN_APIKEY}`).toString('base64');
      // POST REST API with the email form data
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": `Basic ${credentials}`
        },
        body: form
      });
      // handle response errors or OK data

      if (resp.status <= 201) {
        return resp.json();
      } else {
        throw new Error(`${resp.status} ${resp.statusText}`);
      }    
}

// REST API serverless function
app.post('/email', async (req, res) => {
  const conn = await Datastore.open();
  // add contact til mailinglist data collection
  const doc = await conn.insertOne('mailinglist', req.body);  
  // return new document to client
  res.status(201).json(doc);  
});

app.get('/foo', async (req, res) => {
  console.log(req)
  const conn = await Datastore.open();    
  const options = {
    hints: {$fields: {_id: 0, grill: 0}}
  }
  conn.getMany('mailinglist', options).json(res); 
})

// Queue topic serverless worker function
app.queue('emailQueue', async (req, res) => {
  const conn = await Datastore.open();    
  try {    
    // signal that we are processing emails
    await conn.set('running', new Date().toISOString(), {"ttl": 1000*10,"keyspace": "emailprocess"});
    const { emailaddress, name } = req.body.payload;
    // inc attempt counter
    const entry = await conn.updateOne('mailinglist', req.body._id, {$inc: {"attempt": 1}});
    // log email and attempt
    console.log(entry.emailaddress, entry.attempt)
    // call Mailgun function
    const reciept = await sendOneEmail(emailaddress, name);
    // print Mailgun response
    console.log("Mailgun reciept", reciept.id);
    // update database object with sent timestamp
    await conn.updateOne('mailinglist', req.body._id, {emailSent: new Date().toISOString()});
    // finish queue worker
    res.end();
    
  } catch (ex) {
    // inc attempt counter
    console.error("Send mail failed", ex);
    const entry = await conn.updateOne('mailinglist', req.body._id, {$inc: {"attempt": 1}});    
    res.end();
  }
});

// cron job serverless function to process unsent emails
app.job('*/10 * * * * *', async (req, res) => {
  try {
    const conn = await Datastore.open();
    // Check key-val store for the running flag
    const isRunning = await conn.get('running', {"keyspace": "emailprocess"});
    console.log(isRunning)
    // No process is running, start sending new emails
    if (isRunning === null) {      
      // Add all emails that is not sent to queue
      const job = await conn.enqueueFromQuery('mailinglist', { $or: [{attempt: {$gt: 1, $lt: 3}}, {"attempt": {$exists: false}}] },  'emailQueue');
      if (job.count > 0) console.log("Email process starting", job.count, "contacts")
    }
    res.end();
  } catch (ex) {
    console.error(ex);
    res.end();
  }
})

// bind to serverless runtime
export default app.init();
