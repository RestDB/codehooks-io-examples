/*
* GPT-3 REST API example using serverless node.js and codehooks.io
*/

import { app, Datastore } from 'codehooks-js';
import fetch from 'node-fetch';


// REST API routes
app.post('/chat', async (req, res) => {
    if (!process.env.OPENAI_API_KEY) return res.status(500).end('Please add your OPENAI_API_KEY'); // CLI command: coho set-env OPENAI_API_KEY 'XXX' 
    const { ask } = req.body;
    const db = await Datastore.open();
    const cacheKey = 'chatgpt_cache_' + ask;

    // check cache first    
    const cachedAnswer = await db.get(cacheKey);

    // get from cache or OpenAi
    if (cachedAnswer) {
        res.end(cachedAnswer)
    } else { // get from Open AI API

        // pick text element from the OpenAI response by JS nested destructuring
        const { choices: { 0: { text } } } = await callOpenAiApi(ask);
        console.log(ask, text);

        // add to cache for 1 minute
        await db.set(cacheKey, text, { ttl: 60 * 1000 });
        // send text back to client
        res.end(text);
    }
})

// Call OpenAI API
async function callOpenAiApi(ask) {

    const raw = JSON.stringify({
        "model": "text-davinci-003",
        "prompt": ask,
        "temperature": 0.6,
        "max_tokens": 1024,
        "stream": false
    });

    var requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://api.openai.com/v1/completions", requestOptions);
    return response.json();

}

// global middleware to IP rate limit traffic
app.use(async (req, res, next) => {
    const db = await Datastore.open();
    // get client IP address
    const ipAddress = req.headers['x-real-ip'];
    // increase count for IP
    const count = await db.incr('IP_count_' + ipAddress, 1, { ttl: 60 * 1000 })
    console.log(ipAddress, count);
    if (count > 10) {
        // too many calls
        res.status(429).end("Sorry too many requests for this IP");
    } else {
        // ok to proceed
        next();
    }
})

// Export app to the serverless runtime
export default app.init();
