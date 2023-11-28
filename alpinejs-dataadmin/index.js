
/*
* Codehooks (c) example: Alpine.js SPA app
* Install: npm i codehooks-js
*/
import { app, filestore } from 'codehooks-js'
import startpage from './html/index.html'
import collectionView from './html/collection.html'
import dashboardView from './html/dashboard.html'
import profileView from './html/profile.html'

import handlebars from 'handlebars';
//import layouts from 'handlebars-layouts';

// Compile template at startup
var template = handlebars.compile(startpage);

// view config
const viewConfig = {
  root: "/dev/app", 
  space: "dev", 
  version: "0.1", 
  collectionView, 
  dashboardView, 
  profileView
}

// server app public
app.auth('/app*', (req, res, next) => {
  next()
})

app.get('/app*', async (req, res) => {
  // Render html template with page fragments
  res.send(template(viewConfig))
})
app.static({ route: '/assets', directory: '/assets' })

// Use Crudlify to create a REST API for any collection
app.crudlify()

// bind to serverless runtime
export default app.init();
