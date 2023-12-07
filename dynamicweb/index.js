/*
* Codehooks (c) example: Dynamic web pages
* Install: npm i codehooks-js
*/
import {app} from 'codehooks-js'

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
app.auth(/^\/(home|about|services|contact)?$/, (req, res, next) => {
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

app.get('/contact', async (req, res) => {  
  res.render('contact', {title: "Contact us page", root, space})
})

// serve static assets
app.static({ route: '/assets', directory: '/assets' })

// bind to serverless runtime
export default app.init();

