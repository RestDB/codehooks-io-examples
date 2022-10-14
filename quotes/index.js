
/*
* Random quotes API
* Codehooks (c) example.
*/
import app from 'codehooks-js'

// routehook function
function randomQuote(req, res) {
  console.log("Quote coming up soon");
  res.json({"quote": "Coming soon ..."});
}

// REST hook
app.get('/quote', randomQuote);

// bind to serverless runtime
export default app.init();
