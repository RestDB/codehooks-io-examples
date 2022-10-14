
/*
* Random quotes API
* Codehooks (c) example.
*/
import app from 'codehooks-js'

// routehook function
async function randomQuote(req, res) {
  // pick a random index number to fetch by the rowcount index field
  const randomPos = Math.floor(Math.random() * 499709) + 1;
  // open the NoSql Datastore
  const conn = await Datastore.open();
  // tell engine to use index field rowcount, and just start and end at the same pos
  const options = {
    useIndex: "rowcount",
    startIndex: randomPos,
    endIndex: randomPos
  }
  // run the query, returns a stream of 1 item ;)
  conn.getMany('quotes', options)
    .on('data', (data) => {
      const { quote, author } = data;
      res.json({ quote, author })
    })
}

// REST hook
app.get('/quote', randomQuote);

// bind to serverless runtime
export default app.init();
