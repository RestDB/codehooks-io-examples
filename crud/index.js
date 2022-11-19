/*
* Auto CRUD example using yup schema
*/
import app from 'codehooks-js'
import crudlify from 'codehooks-crudlify-yup'
import {customer, product} from './schema'
import {middleware} from './middleware'

// apply middleware
app.use(middleware)

// Add CRUD routes with yup schema
crudlify(app, {customer, product})

// bind to serverless runtime
export default app.init()