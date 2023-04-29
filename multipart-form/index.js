
/*
* Codehooks (c) multipart-form example
*/
import { app } from 'codehooks-js'
import Busboy from 'busboy'

// public route needs no api token
app.auth('/multi/*', (req, res, next) => next())

app.post('/multi', (req, res) => {
    console.log("POST BIN", req)
    if (req.headers['content-type'].startsWith('multipart/form-data')) {
        const bb = Busboy({ headers: req.headers });
        bb.on('file', (name, file, info) => {
            console.log('multi', name, info)
            const { filename, encoding, mimeType } = info;
            let fileSize = 0;
            console.log(filename, encoding, mimeType);
            file.on('data', (data) => {
                //console.log(`File [${filename}] got ${data.length} bytes`);
                fileSize += data.length;
            }).on('close', () => {
                console.log(`File [${filename}] size`, fileSize);
            });
        });
        bb.on('field', (name, val, info) => {
            console.log(`Field [${name}]: value: ${val}`);
        });
        bb.on('close', () => {
            console.log('Done parsing form!');
            res.end('Busboy parsing multipart-form data');
        });
        req.pipe(bb);
    } else {
        res.status(400).end('Not multipart-form data')
    }
})

app.get('/multi', (req, res) => {
    res.end(`
      <html>
        <head></head>
        <body>
          <form method="POST" enctype="multipart/form-data">
            <input type="file" name="filefield"><br />
            <input type="text" name="textfield"><br />
            <input type="submit">
          </form>
        </body>
      </html>
    `);
})

// bind to serverless runtime
export default app.init();
