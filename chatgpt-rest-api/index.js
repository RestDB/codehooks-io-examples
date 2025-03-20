import { app, Datastore } from 'codehooks-js';
import fetch from 'node-fetch';

// REST API routes
app.post('/chat', async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' }); // CLI command: coho set-env OPENAI_API_KEY 'XXX'
  }
  
  const { ask } = req.body;
  if (!ask) {
    return res.status(400).json({ error: 'Missing ask parameter' });
  }
  
  const db = await Datastore.open();
  const cacheKey = `chatgpt_cache_${ask}`;
  
  // Check cache first
  const cachedAnswer = await db.get(cacheKey);
  if (cachedAnswer) {
    return res.json({ response: cachedAnswer });
  }
  
  try {
    // Call OpenAI API
    const response = await callOpenAiApi(ask);
    const { choices } = response;
    const text = choices?.[0]?.message?.content || 'No response';
    
    // Cache response for 1 minute
    await db.set(cacheKey, text, { ttl: 60 * 1000 });
    
    res.json({ response: text });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

// Call OpenAI API
async function callOpenAiApi(ask) {
  const requestBody = {
    model: 'gpt-4-turbo',
    messages: [{ role: 'system', content: 'You are a helpful AI assistant.' }, { role: 'user', content: ask }],
    temperature: 0.6,
    max_tokens: 1024,
  };
  
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  };
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
  return response.json();
}

// Global middleware to IP rate limit traffic
app.use(async (req, res, next) => {
  const db = await Datastore.open();
  const ipAddress = req.headers['x-real-ip'] || req.ip;
  
  // Increase count for IP
  const count = await db.incr(`IP_count_${ipAddress}`, 1, { ttl: 60 * 1000 });
  console.log('Rate limit:', ipAddress, count);
  
  if (count > 10) {
    return res.status(429).json({ error: 'Too many requests from this IP' });
  }
  
  next();
});

// Export app to the serverless runtime
export default app.init();
