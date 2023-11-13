
/*
* Filestore demo (c) Codehooks.io
* Install: npm i codehooks-js codehooks-crudlify
*/

import {app, filestore} from 'codehooks-js'
import {crudlify} from 'codehooks-crudlify'

// public route middleware
app.auth('/web*', (req, res, next) => {
  next()
})

// get a file text content
app.get('/web/*', async (req, res) => {
  try {
    const filepath = req.path.split('/').slice(3).join('/')    
    if (filepath.endsWith('.html')) {
      res.set('content-type', 'text/html')
    } else if (filepath.endsWith('.css')) {
      res.set('content-type', 'text/css')
    } else if (filepath.endsWith('.png')) {
      res.set('content-type', 'image/png')
    } 

    const filestream = await filestore.getReadStream(`/static/${filepath}`);
    
    filestream.on('data', (buf) => {
      res.write(buf, 'buffer')
    })
    .on('error', (error) => {
      console.log('an error', error)
      throw error;
    })
    .on('end', () => {
      res.end()
    })
  } catch (error) {
    console.error(error)
    res.status(404).end('Not found!')
  }
})

// Use Crudlify to create a REST API for any collection
crudlify(app)

// bind to serverless runtime
export default app.init();
