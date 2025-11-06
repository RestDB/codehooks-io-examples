# React Workflow Client

A modern React application for managing step-wise workflow approvals with real-time updates powered by codehooks.io.

## Features

- 🔐 Mock authentication system with login/logout
- 📊 Step-wise workflow visualization using daisyUI
- ⚡ Real-time updates via Server-Sent Events (SSE)
- 🎨 Beautiful UI with TailwindCSS and daisyUI components
- 🔄 Multi-stage approval workflow
- 📝 Activity logging
- 📱 Responsive design

## Workflow Steps

1. **Registration** - User submits equipment request
2. **Pending Approval** - Waiting for company approval
3. **User Choice** - Select preferred configuration
4. **Pending Final** - Final approval review
5. **Completed** - Application approved or denied

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **daisyUI** - Component library
- **EventSource Polyfill** - SSE client
- **codehooks.io** - Backend platform (separate app)

## Installation

1. **Clone the repository**
   ```bash
   cd react-workflow-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the values:
   - `VITE_API_URL` - Your codehooks.io backend URL
   - `VITE_API_TOKEN` - Your API authentication token

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Usage

### Login

The application includes a mock authentication system. You can:
- Enter any email/password combination to login
- Click "Try Demo Login" for instant access with demo credentials

### Submit an Application

1. After logging in, you'll see the workflow interface
2. Fill out the equipment request form
3. Submit your application
4. Wait for real-time updates from the server

### Real-time Updates

The application connects to your codehooks.io backend using Server-Sent Events (SSE). The connection status is shown in the header:
- 🟢 **Live** - Connected to server
- 🔴 **Offline** - Not connected

When the backend sends events, the workflow automatically progresses through the steps.

## Backend Integration

This client is designed to work with a codehooks.io backend. The backend should implement:

### Required API Endpoints

1. **POST /connect** - Get a listener ID for SSE
   ```json
   Request: { "userId": "12345" }
   Response: { "listenerID": "abc123" }
   ```

2. **GET /workflow/:listenerID** - SSE stream endpoint
   - Returns Server-Sent Events
   - Events should include workflow updates

3. **POST /workflow/submit** - Submit new application
   ```json
   {
     "listenerID": "abc123",
     "userId": "12345",
     "userName": "John Doe",
     "item": "laptop",
     "justification": "Need for work",
     "specifications": "High performance"
   }
   ```

4. **POST /workflow/choice** - Submit user choice
   ```json
   {
     "listenerID": "abc123",
     "userId": "12345",
     "choice": "professional"
   }
   ```

### Expected Server Events

The backend should send events with the following types:

```javascript
// Initial approval
{ type: 'approval_granted', data: {}, timestamp: '2025-11-02T...' }
{ type: 'approval_denied', data: { reason: 'Budget exceeded' }, timestamp: '...' }

// Final decision
{ type: 'final_approval', data: {}, timestamp: '...' }
{ type: 'final_denial', data: { reason: 'Not available' }, timestamp: '...' }
```

## Project Structure

```
react-workflow-client/
├── public/              # Static assets
├── src/
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication context
│   ├── pages/
│   │   ├── Login.jsx            # Login page
│   │   └── Workflow.jsx         # Main workflow page
│   ├── services/
│   │   └── realtimeService.js   # SSE/realtime service
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

**Change Theme:**

Edit `tailwind.config.js` to use different daisyUI themes:

```javascript
daisyui: {
  themes: ["light", "dark", "cupcake", "corporate"],
}
```

**Modify Workflow Steps:**

Edit the `WORKFLOW_STEPS` constant in `src/pages/Workflow.jsx` to customize the workflow stages.

**Update Connection Logic:**

Modify `src/services/realtimeService.js` to change how the app connects to the backend.

## Troubleshooting

### Connection Issues

If the app shows "Offline":
1. Check that your backend is running
2. Verify the `VITE_API_URL` in `.env`
3. Check browser console for errors
4. Verify your API token is correct

### CORS Errors

If you see CORS errors in the console:
- Ensure your codehooks.io backend has CORS properly configured
- The backend should allow requests from `http://localhost:3000`

### Events Not Received

If workflow doesn't progress:
1. Check that the backend is sending events in the correct format
2. Open browser DevTools > Network tab > EventSource
3. Verify events are being received
4. Check console for parsing errors

## Backend Example

For reference, here's a minimal codehooks.io backend structure:

```javascript
import { app, realtime } from 'codehooks-js';

// Create real-time channel
realtime.createChannel('/workflow');

// Connect endpoint
app.post('/connect', async (req, res) => {
  const listenerData = await realtime.createListener('/workflow', req.body);
  res.json({ listenerID: listenerData._id });
});

// Submit application
app.post('/workflow/submit', async (req, res) => {
  // Process application...
  // Simulate approval after delay
  setTimeout(async () => {
    await realtime.publishEvent('/workflow', {
      type: 'approval_granted',
      data: {},
      timestamp: new Date().toISOString()
    });
  }, 5000);
  res.json({ success: true });
});

export default app.init();
```

## License

MIT

## Links

- [codehooks.io Documentation](https://codehooks.io/docs)
- [Real-time API Documentation](https://codehooks.io/docs/realtimeapi)
- [daisyUI Components](https://daisyui.com/components/)
- [TailwindCSS](https://tailwindcss.com/)

