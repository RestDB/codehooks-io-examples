/*
 * React + Codehooks.io example — backend in one file.
 * Verified against `coho prompt` (codehooks-js, 2026-11-10).
 *
 * The whole demo ships in a single `coho deploy`:
 *   - app.init(startFn) runs the start function once on boot and seeds the
 *     `messages` collection the first time (idempotent — skips if non-empty).
 *   - GET /api/hello returns the greeting and atomically bumps a visitor
 *     count in the key-value store.
 *   - GET /api/messages returns the rotating list seeded by the start function.
 *   - app.static serves the built React app, so the API and the frontend
 *     live in the same project and the same deploy.
 */
import { app, Datastore } from 'codehooks-js';

// The rotating messages. The start function below inserts these into the
// database the first time the app boots.
const SEED_MESSAGES = [
  'Deployed to the cloud in about five seconds.',
  'The whole app is one file and one command.',
  'The database came with the project, so there is no connection string.',
  'These lines were inserted once, inside the app.init() start function.',
  'The counter is real server state, kept in the key-value store.',
  'Your React build and this API ship in the same deploy.',
];

// Routes need an API token by default. Open up GET so the browser can read.
app.auth('/api/*', (req, res, next) => {
  if (req.method === 'GET') return next();
  next('Only GET is public on this demo.');
});

// GET /api/hello — the greeting, plus an atomic visitor count.
app.get('/api/hello', async (req, res) => {
  const db = await Datastore.open();
  const visitors = await db.incr('visitors', 1); // atomic, returns the new value
  res.json({ message: 'Hello World!', visitors });
});

// GET /api/messages — the rotating list, in the order it was seeded.
app.get('/api/messages', async (req, res) => {
  const db = await Datastore.open();
  const rows = await db.getMany('hellomessages', {}, { sort: { order: 1 } }).toArray();
  res.json(rows.map((row) => row.text));
});

// Serve the built React app. `coho upload ./dist` puts the build here first.
app.static({
  route: '/',
  directory: '/dist',
  default: 'index.html',
  notFound: '/index.html', // SPA fallback for client-side routing
});

// The start function runs once when the app boots. Seed the messages if the
// collection is still empty.
export default app.init(async () => {
  const db = await Datastore.open();
  const existing = await db.getMany('hellomessages', {}).toArray();
  if (existing.length === 0) {
    for (let order = 0; order < SEED_MESSAGES.length; order++) {
      await db.insertOne('hellomessages', { text: SEED_MESSAGES[order], order });
    }
    console.log(`Seeded ${SEED_MESSAGES.length} messages`);
  }
});
