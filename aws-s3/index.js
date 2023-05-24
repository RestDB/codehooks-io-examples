
/*
* Codehooks (c) AWS S3 example
*/
import { app } from 'codehooks-js'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { PassThrough } from 'stream'

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET } = process.env;

const s3config = {
    region: AWS_REGION,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY
}

const s3client = new S3Client(s3config);

// public access
app.auth('/download/*', (req, res, next) => {
    if (req.method === 'GET') {
        next()
    } else {
        res.status(403).end('Not public')
    }
})

// API to GET a binary data stream from AWS S3
app.get('/download/:file', async (req, res) => {
    try {
        // filename from route
        const { file } = req.params;
        const input = {
            "Bucket": AWS_BUCKET,
            "Key": `tmp/${decodeURI(file)}` // decode filename and store in /bucket/tmp/file
        };
        // Create get command
        const command = new GetObjectCommand(input);
        // Send get command
        const response = await s3client.send(command);
        // set content-type
        res.set('content-type', response.ContentType)
        // stream data back to client
        response.Body.pipe(res.writable)
    } catch (error) {
        // Woops
        res.status(400).end(error.message)
    }
})

// API to POST a binary data stream to AWS S3
app.post('/upload/single', async (req, res) => {
    try {
        // get size, type and filename from destructured header values
        const { 'content-length': ContentLength, 'content-type': ContentType, filename } = req.headers;

        const input = {
            "Bucket": AWS_BUCKET,
            "Key": `tmp/${filename}`,  // emulate file system /bucketname/tmp/filename
            "Body": new PassThrough(), // stream to pipe data through
            "ContentLength": ContentLength,
            "ContentType": ContentType
        };
        // pipe binary request data to S3 stream
        req.pipe(input.Body);
        // create put command
        const command = new PutObjectCommand(input);
        // execute put object command
        const response = await s3client.send(command);
        // return data to client
        res.json(response);
    } catch (error) {
        // some error occured, return 400 status to client
        res.status(400).end(error.message)
    }
})

// bind to serverless runtime
export default app.init();
