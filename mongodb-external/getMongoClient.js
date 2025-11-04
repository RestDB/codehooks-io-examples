import { MongoClient } from "mongodb-3";

export const connectionString = process.env.MONGO_URI;

export let mongoConn = null;

export function getMongoClient() {
    return new Promise((resolve, reject) => {
        if (mongoConn) {
            // cached conn
            return resolve(mongoConn);
        }
        //console.log('conn str', process.env);
        MongoClient.connect(connectionString, function (err, conn) {
            if (err || !conn) {
                console.log("Err connect", err, conn);
                return reject(err);
            }
            mongoConn = conn.db("userdb");

            console.log("Successfully connected to MongoDB.");
            resolve(mongoConn);
        });
    });
}
