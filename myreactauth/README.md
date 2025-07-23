# React Auth Full-Stack App with Codehooks.io

This is a complete full-stack authentication application demonstrating how to host both React frontend and API backend on Codehooks.io. The app showcases OAuth authentication with GitHub and Google, user management, and a seamless deployment workflow.

## Architecture Overview

This application uses a monorepo structure with two main components:

- **Frontend**: React SPA built with Vite
- **Backend**: API using codehooks-js framework
- **Deployment**: Single codehooks.io backend that serves both API endpoints and static frontend files

The key architectural decision is that the React frontend builds into the backend's `/dist` directory, allowing the codehooks.io backend to [serve both the API and the static React app](https://codehooks.io/docs/#frontend-hosting-setup) from a single deployment.

## Project Structure

```
myreactauth/
├── package.json              # Root orchestration scripts
├── frontend/                 # React application
│   ├── package.json         # Frontend dependencies & scripts
│   ├── src/
│   │   ├── App.jsx          # Main React app with routing
│   │   ├── components/
│   │   │   ├── Auth.jsx     # Authentication provider
│   │   │   ├── HomePage.jsx # Landing page
│   │   │   └── UserInfo.jsx # Protected user profile page
│   │   └── main.jsx         # React entry point
│   └── vite.config.js       # Vite bundler configuration
├── backend/                  # Codehooks.io backend
│   ├── package.json         # Backend dependencies & deployment
│   ├── src/
│   │   ├── index.ts         # Main backend entry point
│   │   ├── auth-settings.ts # OAuth provider configuration
│   │   └── middleware/
│   │       └── userInfo.ts  # JWT authentication middleware
│   ├── auth/                # Authentication UI templates
│   │   └── assets/          # Login/signup page templates
│   └── dist/                # Built frontend files (auto-generated)
└── screenshots/             # Documentation assets
```

## Package.json Commands

### Root Level Commands (`myreactauth/package.json`)

The root package.json orchestrates the full build and deployment pipeline:

```json
{
  "scripts": {
    "build:frontend": "cd frontend && npm install && npm run build",
    "build:backend": "cd backend && npm install && npm run deploy", 
    "build": "npm run build:frontend && npm run build:backend"
  }
}
```

- **`npm run build:frontend`**: Installs frontend dependencies and builds React app
- **`npm run build:backend`**: Installs backend dependencies and deploys to codehooks.io
- **`npm run build`**: Complete build pipeline (frontend → backend deployment)

### Frontend Commands (`frontend/package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build --outDir ../backend/dist",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

- **`npm run dev`**: Start Vite development server (localhost:5173)
- **`npm run build`**: Build React app to `../backend/dist` directory
- **`npm run lint`**: Run ESLint code analysis
- **`npm run preview`**: Preview production build locally

### Backend Commands (`backend/package.json`)

```json
{
  "scripts": {
    "deploy": "coho deploy && coho log -f"
  }
}
```

- **`npm run deploy`**: Deploy to codehooks.io and follow logs

## Build and Deployment Process

### Development Workflow

1. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev
   ```
   - React app runs on `http://localhost:5173`
   - Hot reload for rapid development

2. **Backend Development** (if needed):
   ```bash
   cd backend
   npm run deploy
   ```
   - Deploys backend changes to codehooks.io
   - Logs are displayed for debugging

### Production Deployment

The complete deployment process:

```bash
# From the root directory
npm run build
```

This executes the following sequence:

1. **Frontend Build** (`npm run build:frontend`):
   - `cd frontend && npm install` - Install/update dependencies
   - `npm run build` - Vite builds React app
   - Output goes to `../backend/dist/` directory

2. **Backend Deploy** (`npm run build:backend`):
   - `cd backend && npm install` - Install/update backend dependencies  
   - `npm run deploy` - Deploy to codehooks.io using `coho deploy`
   - `coho log -f` - Follow deployment logs

### How Frontend and Backend Are Integrated

The magic happens in the backend's `index.ts`:

```typescript
// Serve React app from /dist directory
app.static({ 
  route: '/', 
  directory: '/dist', 
  default: 'index.html', 
  notFound: '/index.html' 
}, cacheFunction)
```

This configuration:
- Serves the built React app from the `/dist` directory
- Routes all unknown paths to `index.html` for client-side routing
- Applies caching headers for better performance

## Authentication Features

- **OAuth Providers**: GitHub and Google authentication
- **JWT Tokens**: Secure session management
- **Protected Routes**: User info page requires authentication
- **Custom UI**: Handlebars templates for login/signup pages
- **User Storage**: User data stored in codehooks.io Datastore

## API Endpoints

- `GET /api/hello` - Public test endpoint
- `GET /api/userinfo` - Protected user profile (requires JWT)
- `/auth/*` - Authentication routes (login, signup, logout, callbacks)

## OAuth Setup

### GitHub Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: [Your App Name]
   - Homepage URL: [Your codehooks.io URL]
   - Authorization callback URL: [Your codehooks.io URL]/api/auth/callback/github

### Google Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Configure Consent Screen" and set up OAuth consent
5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: [Your codehooks.io URL]
   - Authorized redirect URIs: [Your codehooks.io URL]/api/auth/callback/google

Save your Client ID and Client Secret, then configure them in `backend/src/auth-settings.ts`.

## Key Dependencies

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server

### Backend  
- **codehooks-js** - Codehooks.io framework
- **codehooks-auth** - Authentication middleware
- **jsonwebtoken** - JWT token handling
- **handlebars** - Template engine for auth pages

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   cd myreactauth
   npm run build:frontend
   ```

2. **Configure OAuth** (update `backend/src/auth-settings.ts`)

3. **Deploy**:
   ```bash
   npm run build:backend
   ```

4. **Access your app** at the provided codehooks.io URL

The app demonstrates a complete full-stack deployment workflow where both frontend and backend are served from a single codehooks.io endpoint, making it cost-effective and simple to manage.


