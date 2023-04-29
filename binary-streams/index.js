
/*
* Codehooks (c) binary streams example
*/
import { app, Datastore } from 'codehooks-js'
import Busboy from 'busboy'

app.post('/bin', (req, res) => {
    console.log("POST BIN", req)
    res.set('content-type', req.headers['content-type'])
    //req.pipe(res.writable)
    
    req.on('data', (buf) => {
        res.write(buf, 'buffer')
    })
    req.on('end', (bytes) => {
        console.log('binary done', bytes)        
        res.end()
    })
})

app.auth('/multi*', (req, res, next) => next())

app.post('/multi', (req, res) => {
    console.log("POST BIN", req)
    if (req.headers['content-type'].startsWith('multipart/form-data')) {
        const bb = Busboy({ headers: req.headers });
        const uploads = {};
        bb.on('file', (name, file, info) => {
            console.log('multi', name, info)
            const { filename, encoding, mimeType } = info;
            let fileSize = 0;
            uploads[filename] = info;
            console.log(filename, encoding, mimeType);
            file.on('data', (data) => {
                //console.log(`File [${filename}] got ${data.length} bytes`);
                fileSize += data.length;
                uploads[filename].size = fileSize;
            }).on('close', () => {
                console.log(`File [${filename}] size`, fileSize);
            });
        });
        bb.on('field', (name, val, info) => {
            console.log(`Field [${name}]: value: ${val}`);
        });
        bb.on('close', () => {
            console.log('Done parsing form!');
            res.end(`<pre>${JSON.stringify(uploads, null, '  ')}</pre>`);
        });
        bb.on('error',(err) => console.log(err))
        //req.pipe(bb);
        req.on('data', (buf) => {
            bb.write(buf, 'buffer')
        })
        req.on('end', (bytes) => {
            console.log('multi done', bytes)        
            bb.end()
        })
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
            <input type="file" name="filefield"><br />
            <input type="text" name="textfield"><br />
            <input type="submit">
          </form>
        </body>
      </html>
    `);
})

// bind to serverless runtime
export default app.init()
