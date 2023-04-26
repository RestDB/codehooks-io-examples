
/*
* Codehooks (c) mongoDB example
*/
import { app } from 'codehooks-js'
import { MongoClient } from "mongodb-3";

const connectionString = process.env.MONGO_URI;

let mongoConn = null;

function getMongoClient() {
    return new Promise((resolve, reject) => {
        if (mongoConn) {
            // cached conn
            return resolve(mongoConn)
        }
        console.log('conn str', process.env)
        MongoClient.connect(connectionString, function (err, conn) {
            if (err || !conn) {
                console.log("Err connect", err, conn)
                return reject(err);
            }
            mongoConn = conn.db("userdb");

            console.log("Successfully connected to MongoDB.");
            resolve(mongoConn);
        });
    })
}

app.get('/getmongodbdata', async (req, res) => {
    try {
        res.set('content-type', 'application/json')
        const dbConnect = await getMongoClient();
        let collection = dbConnect.collection('users');
        const cursor = collection.find({}, { limit: 100, sort: { _id: -1 }, projection: { email: 1, username: 1 } });
        await cursor.forEach((data) => {
            res.write(JSON.stringify(data)).write('\n');
        });
        res.end();

    } catch (error) {
        res.status(403).end(error.message)
    }
})



// bind to serverless runtime
export default app.init();

