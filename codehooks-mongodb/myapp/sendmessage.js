import {Datastore} from 'codehooks-js'

// POST send a queued message to all users
export default async function message(req, res) {
    const {message} = req.body
    let count = 0
    // queue one message to all active users
    const db = await Datastore.open()
    const coll = db.getCollection('user')
    const filter = {active: true}
    coll.getMany({filter})
    .on('data', async (aUser) => {
        ++count
        console.log("User data", aUser)
        const qres = await db.enqueue('messageTopic', {message, user: aUser})
        console.log('Queue result', qres, count)
        
    })
    .on('end', function() {
        console.log("End", count)
        res.end(`You're message was queued to ${count} users.`)
    })
}
/*
app.all('/myroute2', async (req, res) => {
    const db = await Datastore.open()
    const coll = db.getCollection('user')
    const filter = {name: /Jane|Joey/}
    const updata = await coll.updateMany({$set: {washere: new Date()}}, {filter})
    console.log(updata)
    
    // or like this
    coll.getMany({filter}).pipe(res)
})

*/