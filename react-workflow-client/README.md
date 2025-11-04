# React Workflow Client

A full-stack React workflow application with real-time updates, built on Codehooks.io. Features a step-wise approval process with SSE (Server-Sent Events), mock auth, and TailwindCSS/daisyUI interface.

## Quick Start

```bash
# Install dependencies
npm install

# Run client in development mode
npm run dev

# Run mock server (testing without backend)
npm run mock-server
```

Visit `http://localhost:5173` (client) or `http://localhost:3001` (mock server)

## Client-Side Setup

The client is a Vite + React application with the following scripts:

### `npm run dev`
Starts the Vite development server. Hot-reload enabled for rapid development.

### `npm run build`
Builds the React client for production to `dist/` folder. Optimizes and minifies for deployment.

### `npm run build:all`
Builds **both** the React client and the Codehooks server in one command:
```bash
npm run build && cd codehooks-server && npm run build
```
Use this before deploying to prepare both frontend and backend.

### `npm run preview`
Preview the production build locally before deployment.

### `npm run mock-server`
Runs a local Express server (`mock-server.js`) that simulates the Codehooks backend with SSE support. Useful for frontend development without deploying the backend.

## Server-Side Setup

The backend is in the `codehooks-server/` directory and includes:

### Installation

```bash
cd codehooks-server
npm install

# Install Codehooks CLI globally (if needed)
npm install -g codehooks
```

### Authentication

```bash
# Login to Codehooks.io
coho login

# Initialize project (first time only)
coho init --empty
```

### Scripts

#### `npm run deploy`
Deploys the application to Codehooks.io. This uploads both:
- Backend code (`index.js`, `workflows/`)
- Frontend static files (from `dist/` if built)

#### `npm run build`
Compiles the Codehooks code to a single `index.cjs` file for deployment validation.

#### `npm run dev`
Watch mode for development - automatically recompiles on file changes.

#### `npm run start` / `npm run stop`
Start/stop the local Docker environment for testing workflows locally.

#### `npm run logs`
View real-time logs from the local Docker container.

## Full Deployment Workflow

```bash
# 1. Build both client and server
npm run build:all

# 2. Deploy to Codehooks.io
cd codehooks-server
npm run deploy

# Your app is now live at https://yourproject.codehooks.io
```

## Project Structure

```
react-workflow-client/
├── src/                        # React client source
│   ├── pages/                  # Login & Workflow pages
│   ├── context/                # Auth context
│   └── services/               # SSE/realtime service
├── codehooks-server/           # Backend (Codehooks.io)
│   ├── index.js                # API routes & static hosting
│   ├── workflows/              # Workflow definitions
│   │   └── approvalWorkflow.js # Multi-step approval logic
│   └── dist/                   # Built React app (after build)
├── mock-server.js              # Local dev mock backend
└── package.json                # Client scripts
```

## Key Features

- **Real-time Updates** - SSE connection for live workflow progress
- **Workflow API** - Stateful multi-step approval process with retry/timeout
- **Static Hosting** - Backend serves the React app from `/dist`
- **Mock Auth** - Simple login system (use any email/password)
- **Responsive UI** - TailwindCSS + daisyUI components

## API Endpoints

- `POST /workflow/create` - Create new workflow instance
- `POST /workflow/:id/submit` - Submit application form
- `POST /workflow/:id/choice` - Submit user choice
- `GET /workflow/:id/state` - Get current workflow state
- `POST /connect` - Create SSE listener
- `GET /workflows` - List all workflows (admin)

## Development Tips

**Local Development:**
1. Use `npm run mock-server` to develop frontend without backend
2. Or use `npm run dev` + local Docker server (`cd codehooks-server && npm run start`)

**Production Build:**
1. Always run `npm run build:all` before deploying
2. Verify build with `npm run preview`
3. Deploy with `cd codehooks-server && npm run deploy`

**Customization:**
- Modify workflow steps in `codehooks-server/workflows/approvalWorkflow.js`
- Update UI theme in `tailwind.config.js` (daisyUI themes)
- Adjust SSE logic in `src/services/realtimeService.js`

## Links

- [Codehooks.io Docs](https://codehooks.io/docs)
- [Workflow API](https://codehooks.io/docs/workflow-api)
- [Realtime API](https://codehooks.io/docs/realtimeapi)

