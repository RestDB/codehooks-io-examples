/*
* Codehooks (c) example: Dynamic web pages
* Install: npm i codehooks-js
*/
import {app, datastore} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import Busboy from 'busboy';

const space = "dev";
const root = `/${space}`;

// layout helper
handlebars.registerHelper(layouts(handlebars));

// web page views
app.set('views', '/views')
app.set('layout', '/views/layout.hbs');
app.set('view engine', {"hbs": handlebars})

// allow public access to /web*
app.auth(/^\/(home|about|services|contact|thanks|products|product\/.*)?$/, (req, res, next) => {
  next()
})

/* public routes */
app.get('/', async (req, res) => {  
  res.render('home', {title: "Home page", root, space})
})

app.get('/about', async (req, res) => {  
  res.render('about', {title: "About page", root, space})
})

app.get('/services', async (req, res) => {  
  res.render('services', {title: "Services page", root, space})
})

app.get('/products', async (req, res) => {  
  // connect to Database
  const conn = await datastore.open()
  // Query the first 10 products
  const products = await conn.getMany('products', {query: {}, limit: 10}).toArray()
  // set products to Handlebars context for use in view
  res.render('products', {title: "Products page", products, root, space})
})

app.get('/product/:ID', async (req, res) => {  
  // connect to Database
  const conn = await datastore.open()
  // Query the first 10 products
  const {ID} = req.params;
  const product = await conn.getOne('products', ID);
  // set product details to Handlebars context for use in view
  res.render('productDetails', {title: "Products page", product, root, space})
})

// contact form
app.get('/contact', async (req, res) => {  
  res.render('contact', {title: "Contact us page", root, space})
})

// form post
app.post('/contact', (req, res) => {
  const contactInfo = {};
  if (req.headers['content-type'].startsWith('multipart/form-data')) {
      const bb = Busboy({ headers: req.headers });
      
      bb.on('field', (name, val, info) => {
        contactInfo[name] = val;
          console.log(`Field [${name}]: value: ${val}`);
      });
      bb.on('close', async () => {
          console.log('Done parsing form!');
          const conn = await datastore.open()
          // insert one record in the contact collection
          const contact = await conn.insertOne('contact', contactInfo);
          const countres = await conn.getMany('contact', {query: {}, hints: {count: true}}).toArray();
          console.log('Count', countres[0].count)
          res.render('thanks', {title: "Contact us page - thank you", contact, count: countres[0].count, root, space})
      });
      req.pipe(bb);
  } else {
      res.status(400).end('Not multipart-form data')
  }
})

// serve static assets
app.static({ route: '/assets', directory: '/assets' })

// bind to serverless runtime
export default app.init();

