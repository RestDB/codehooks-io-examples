# React + Codehooks example

A complete full-stack app in one small project: a React frontend, a serverless
API, a NoSQL database and a key-value counter. The whole thing (frontend and
backend together) deploys to the cloud with one command.

**Live demo:** https://keen-plateau-53a3.codehooks.io/
**Walkthrough:** https://codehooks.io/react-codehooks-example

![The React + Codehooks example app](https://codehooks.io/img/react-codehooks-example/app-screenshot.webp)

## What it shows

The app renders three things, each backed by a few lines in [`index.js`](./index.js):

- **`Hello World!`** — returned by `GET /api/hello`.
- **A rotating list of messages** — inserted into the database by the
  `app.init()` start function the first time the app boots, then read back by
  `GET /api/messages`.
- **A live visitor counter** — an atomic `db.incr('visitors', 1)` against the
  key-value store, returned alongside the greeting.

## How it fits together

```
index.js          Codehooks backend (API + database + start function + static hosting)
src/App.jsx       React app that fetches /api/hello and /api/messages
dist/             the built React app, served by the backend via app.static()
```

The backend serves the built React app with `app.static()`, so in production the
frontend and the API share one origin and the frontend can call `/api/hello`
with a relative path.

## Run it yourself

```bash
npm install

# One-time: create a Codehooks project and link this folder
coho create            # or: coho init <project> <space> to use an existing one

# Build the React app, upload it, and deploy the backend
npm run build
coho upload ./dist
coho deploy
```

`coho deploy` prints your live URL. Open it and the greeting, the rotating
message and the counter all come from your own backend.

### Local frontend development

```bash
# Point the dev server at your deployed backend, then run Vite
VITE_API_URL=https://<your-project>.codehooks.io npm run dev
```

Codehooks sends permissive CORS headers by default, so the Vite dev server on
`localhost` can call your deployed API directly.

## Build it with a coding agent

Run `coho prompt` first — it prints the full `codehooks-js` API reference — then
ask your agent to build the backend. It will reach for the same `app.init()`
start function, the key-value counter and `app.static()` you see here. See
[AI agent setup](https://codehooks.io/docs/ai-agent-setup).

## Notes

- The code in `index.js` was verified against `coho prompt` (codehooks-js,
  2026-11-10) by deploying it and loading the live app.
- Routes need an API token by default. The `app.auth('/api/*', ...)` hook opens
  up `GET` so the browser can read without a token.
- The messages live in a `hellomessages` collection; the start function only
  seeds it when it is empty, so a redeploy will not duplicate them.
