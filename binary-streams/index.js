
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
        <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <h2>Codehooks multipart/form-data upload demo</h2>
          <form method="POST" enctype="multipart/form-data">
            <h3>File 1</h3>
            <input type="file" name="filefield1"><br />
            <h3>Text field 1</h3>
            <input type="text" name="textfield1"><br />

            <h3>File 2</h3>
            <input type="file" name="filefield2"><br />
            <h3>Text field 2</h3>
            <input type="text" name="textfield2"><br />
            
            <hr/>
            
            <input type="submit">
          </form>
        </body>
      </html>
    `);
})

// bind to serverless runtime
export default app.init()
