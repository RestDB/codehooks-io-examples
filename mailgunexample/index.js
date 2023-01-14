
/*
* Mailgun integration example.
*/
import {app, Datastore} from 'codehooks-js';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Mailgun REST API endpoint address
const MAILGUN_URL = 'api.eu.mailgun.net'; // or api.mailgun.net for US customers

// REST API for sending email to list of recipients
app.post('/sendmail', async function (req, res) {
  // pick from post
  const {email, name} = req.body;
  // create an email as form data
  const form = new FormData();
  form.append('from', 'jones@codehooks.io');
  form.append('to', email);
  form.append('subject', 'Testing Mailgun with Codehooks');
  form.append('text', `Hello ${name}, hope you are ok. Lets meet soon.`);
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
    // Success, return Mailgun response to the REST API client
    const output = await resp.json();
    console.log("Success", output);
    // insert log to the NoSQL database
    const db = await Datastore.open();    
    const doc = await db.insertOne('maillog', {email, name, output});  
    return res.status(201).json(output);
  } else {
    console.error(rest.status, resp.statusText);
    // pass the Mailgun error to the REST API client
    return res.status(resp.status).json({error: resp.statusText});
  }    
})

// bind to serverless runtime
export default app.init();
