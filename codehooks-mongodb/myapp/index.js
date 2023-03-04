/* index.js
*  Example codehooks-mongodb backend app
*/
import app from 'codehooks-js'
import crudlify from 'codehooks-crudlify-yup'
import {user} from './schema.js'; // Yup data schema definition

import message from './sendmessage.js' // Helper function for sending messages
import queueIt from './queueHelper.js' // Worker function for queued functions

// call the imported local lib function
app.post('/message', message)

// queue worker function to topic
app.queue('messageTopic', queueIt)

// Add CRUD routes for a user schema - collection
crudlify(app, {user})

export default app.init() // export app scope to serverless runtime