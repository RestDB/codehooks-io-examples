/* index.js
*  Example codehooks-mongodb backend app
*/
import app from 'codehooks-js'
import crudlify from 'codehooks-crudlify'
import {user} from './schema.js'; // Yup data schema definition

// Add CRUD routes for a user schema - collection
crudlify(app, {user})

export default app.init() // export app scope to serverless runtime