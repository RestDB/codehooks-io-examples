# Workflow Application Server (Codehooks.io)

Production-ready server for the workflow application system using codehooks.io platform.

## Quick Start

```bash
# Build the React frontend first (from project root)
cd ..
npm run build

# Install Codehooks CLI
npm install -g codehooks

# Install dependencies (from codehooks-server directory)
cd codehooks-server
npm install

# Login and deploy
coho login
coho init --empty
npm run deploy
```

## Features

- ✅ **Realtime API** - Server-Sent Events for live updates  
- ✅ **Workflow API** - Stateful approval workflows with automatic retry
- ✅ **Datastore** - Persistent workflow state storage
- ✅ **Cron Jobs** - Automatic timeout handling
- ✅ **Scalable** - Distributed processing with automatic failover
- ✅ **Static Hosting** - Serves the React frontend from `/dist`

## API Endpoints

- `POST /workflow/create` - Create new workflow
- `GET /workflow/:id/state` - Get workflow state
- `POST /workflow/:id/submit` - Submit application
- `POST /workflow/:id/choice` - Submit user choice
- `POST /connect` - Create SSE listener
- `GET /workflows` - List workflows (admin)

## Documentation

See the full documentation in the project root README.

## Deployment

1. **Build the React frontend** (from project root):
   ```bash
   cd ..
   npm run build
   ```
   This builds the React app to `codehooks-server/dist/`

2. **Deploy to Codehooks** (from codehooks-server directory):
   ```bash
   cd codehooks-server
   npm install -g codehooks  # If not already installed
   coho login
   npm run deploy
   ```

3. The deployment includes both:
   - Backend API and workflows
   - Frontend static files (React app)

## Configuration

### For Local Development

Update your React client `.env` to point to the local server:

```env
VITE_API_URL=http://localhost:8080
VITE_API_TOKEN=your-local-api-token
```

### For Production

After deployment, the frontend and backend are served from the same domain, so no `.env` configuration is needed in the built app. The React app will use relative URLs automatically.

For production builds, update `.env.production`:

```env
VITE_API_URL=
VITE_API_TOKEN=your-production-token-from-codehooks-dashboard
```

## Support

- Documentation: https://codehooks.io/docs
- Realtime API: https://codehooks.io/docs/realtimeapi
- Workflow API: https://codehooks.io/docs/workflow-api

