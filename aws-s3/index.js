
/*
* Codehooks (c) AWS S3 example
*/
import { app } from 'codehooks-js'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { PassThrough } from 'stream'

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const s3config = {
    region: 'eu-central-1',
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY
}

const s3 = new S3Client(s3config);

// public access
app.auth('/s3/*', (req, res, next) => {
    if (req.method === 'GET') {
        next()
    } else {
        res.status(403).end('Not public')
    }    
})

app.get('/s3/:file', async (req, res) => {
    try {
        const { file } = req.params;
        const input = {
            "Bucket": "coho-dev",
            "Key": `tmp/${file}`
        };
        const command = new GetObjectCommand(input);
        const response = await s3.send(command);
        const stream = response.Body
        /* classic way
        .on('data', (buf) => res.write(buf, 'buffer'))
        .on('end', res.end)
        */
        console.log(response.ContentType)
        res.set('content-type', response.ContentType)

        stream.pipe(res.writable)

    } catch (error) {
        console.error('eerroorr', error.message)
        res.status(400).end(error.message)
    }
})

app.post('/s3/:file', async (req, res) => {
    try {
        const { 'content-length': ContentLength, 'content-type': ContentType } = req.headers;
        const { file } = req.params;
        console.log(file, ContentType, ContentLength)

        const stream = new PassThrough();
        
        const input = {
            "Bucket": "coho-dev",
            "Key": `tmp/${file}`,
            "Body": stream,
            "ContentLength": parseInt(ContentLength),
            "ContentType": ContentType
        };

        req.pipe(stream);

        const command = new PutObjectCommand(input);
        const response = await s3.send(command);
        res.json(response)
    } catch (error) {
        console.error('auuch', error)
        res.status(400).end(error.message)
    }
})

// bind to serverless runtime
export default app.init();
