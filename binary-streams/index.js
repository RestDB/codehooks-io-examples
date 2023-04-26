
/*
* Codehooks (c) binary streams example
*/
import { app, Datastore } from 'codehooks-js'

app.post('/bin', (req, res) => {
    console.log("POST BIN", req)
    if (req.headers['content-type'].startsWith('application/octet-stream')) {
        req.on('data', (buf) => {
            console.log(buf.length)
        })
        req.on('end', (bytes) => {
            console.log('binary done', bytes)
            res.end('Got binary ' + bytes)
        })
    }
})

// bind to serverless runtime
export default app.init();
