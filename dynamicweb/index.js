/*
* Codehooks (c) example: Dynamic web pages
* Install: npm i codehooks-js
*/
import {app, datastore} from 'codehooks-js'

import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';

const space = "dev";
const root = `/${space}`;

// layout helper
handlebars.registerHelper(layouts(handlebars));

// web page views
app.set('views', '/views')
app.set('layout', '/views/layout.hbs');
app.set('view engine', {"hbs": handlebars})

// allow public access to /web*
app.auth(/^\/(home|about|services|contact|products|product\/.*)?$/, (req, res, next) => {
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

app.get('/contact', async (req, res) => {  
  res.render('contact', {title: "Contact us page", root, space})
})

// serve static assets
app.static({ route: '/assets', directory: '/assets' })

// bind to serverless runtime
export default app.init();

