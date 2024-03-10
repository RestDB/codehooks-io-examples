/*
  Alpine.js REST API data example
*/
import {app} from 'codehooks-js'

app.static({route: "/static", directory: "/app"})

// Use Crudlify to create a REST API for any collection
app.crudlify()

// bind to serverless runtime
export default app.init();
