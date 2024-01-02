/*
* Codehooks (c) example: Dynamic web pages
* Install: npm i codehooks-js
*/
import {app, datastore} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import Busboy from 'busboy';

const baseUrl = 'http://dynamicweb-h2pl.api.codehooks.io/dev/'; // for development without a domain
//const baseUrl = 'https://www.example.com'; // with a custom domain

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
  res.render('home', {title: "Home page", baseUrl, home: true})
})

app.get('/home', async (req, res) => {  
  res.render('home', {title: "Home page", baseUrl, home: true})
})

app.get('/about', async (req, res) => {  
  res.render('about', {title: "About page", baseUrl, about: true})
})

app.get('/services', async (req, res) => {  
  res.render('services', {title: "Services page", baseUrl, services: true})
})

app.get('/products', async (req, res) => {  
  // connect to Database
  const conn = await datastore.open()
  // Query the first 10 products
  const productList = await conn.getMany('products', {query: {}, limit: 10}).toArray()
  // set products to Handlebars context for use in view
  res.render('products', {title: "Products page", productList, baseUrl, products: true})
})

app.get('/product/:ID', async (req, res) => {  
  // connect to Database
  const conn = await datastore.open()
  // Query the product ID
  const {ID} = req.params;
  const product = await conn.getOne('products', ID);
  // set product details to Handlebars context for use in view
  res.render('productDetails', {title: "Products page", product, baseUrl, products: true})
})

// contact form
app.get('/contact', async (req, res) => {  
  res.render('contact', {title: "Contact us page", baseUrl, contact: true})
})

// form post
app.post('/contact', (req, res) => {
  console.log("POST contact", req)
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
          const contactData = await conn.insertOne('contact', contactInfo);
          const countres = await conn.getMany('contact', {query: {}, hints: {count: true}}).toArray();
          console.log('Count', countres[0].count)
          res.render('thanks', {title: "Contact us page - thank you", contactData, count: countres[0].count, baseUrl, contact: true})
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

