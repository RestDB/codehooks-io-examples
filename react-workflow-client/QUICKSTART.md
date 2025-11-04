# Quick Start Guide

Get the React Workflow Client up and running in 5 minutes!

## 🚀 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

## 🎯 Option A: With Mock Backend (Recommended for Testing)

Perfect for testing the frontend before the real backend is ready.

### Step 1: Start the Mock Server

In one terminal:
```bash
npm run mock-server
```

You should see:
```
✅ Mock Workflow Server is running!

   🌐 Server URL: http://localhost:3001
   📡 SSE endpoint: http://localhost:3001/workflow/:listenerID
```

### Step 2: Start the React App

In another terminal:
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Step 3: Open and Test

1. Open http://localhost:3000 in your browser
2. Click **"Try Demo Login"** to log in instantly
3. Fill out the equipment request form
4. Click **"Submit Application"**
5. Wait 3-5 seconds - the workflow will automatically progress
6. Make your choice when prompted
7. Wait for final approval/denial

**The mock server simulates:**
- ✅ 80% approval rate for initial requests
- ⏱️ 3-5 second delay for first approval
- ⏱️ 2-4 second delay for final decision
- 📊 Different approval rates based on configuration choice

## 🌐 Option B: With Real codehooks.io Backend

If you already have a codehooks.io backend running:

### Step 1: Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your backend details:
```env
VITE_API_URL=https://your-app.codehooks.io
VITE_API_TOKEN=your-actual-api-token
```

### Step 2: Start the App

```bash
npm run dev
```

### Step 3: Test

Open http://localhost:3000 and log in!

## 📱 Using the App

### Login Screen

**Quick Demo:**
- Click "Try Demo Login" button

**Manual Login:**
- Enter any email address (e.g., `john@company.com`)
- Enter any password
- Click "Login"

*Note: This is a mock authentication system for demo purposes*

### Workflow Screen

**Header:**
- 🟢 **Live** indicator shows connection status
- User menu in top-right for logout

**Progress Steps:**
- Visual indication of current stage
- 5 total stages in the workflow

**Main Content:**
1. **Registration** - Fill out equipment request
2. **Pending Approval** - Wait for company decision (animated)
3. **User Choice** - Select configuration (on approval)
4. **Pending Final** - Wait for final review (animated)
5. **Completed** - See final result

**Activity Log:**
- Shows all workflow events
- Timestamps and event details
- Updates in real-time

## 🔧 Troubleshooting

### "Offline" Status

**Problem:** Red "Offline" indicator in header

**Solutions:**
1. Check mock server is running: `npm run mock-server`
2. Verify `.env` has correct `VITE_API_URL`
3. Check browser console for errors
4. Try refreshing the page

### Connection Errors

**Problem:** Console shows connection errors

**Solutions:**
1. Restart mock server
2. Restart React app
3. Clear browser cache
4. Check no other service is using port 3001 or 3000

### Events Not Received

**Problem:** Workflow doesn't progress

**Solutions:**
1. Open DevTools > Network tab
2. Look for "workflow" connection
3. Check it's showing "EventStream"
4. Verify messages are being received
5. Check mock server console for activity

### Port Already in Use

**Problem:** "Port 3000 (or 3001) already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different ports in vite.config.js and mock-server.js
```

## 📚 Next Steps

After testing with the mock server:

1. **Read the full README.md** for detailed documentation
2. **Check DEVELOPMENT.md** for development tips
3. **Set up your codehooks.io backend** (in separate project)
4. **Update .env** with real backend URL
5. **Build for production:** `npm run build`

## 🎨 Customization Quick Tips

**Change Theme:**
```javascript
// tailwind.config.js
daisyui: {
  themes: ["light", "dark", "cupcake"], // Add/remove themes
}
```

**Change Default Theme in HTML:**
```html
<!-- index.html -->
<html lang="en" data-theme="dark">
```

**Modify Workflow Steps:**
Edit `src/pages/Workflow.jsx` - look for `WORKFLOW_STEPS` constant

**Change Ports:**
```javascript
// vite.config.js
server: {
  port: 3000 // Change this
}

// mock-server.js
const PORT = 3001 // Change this
```

## 🐛 Getting Help

If you encounter issues:

1. Check browser console for errors (F12)
2. Check mock server terminal output
3. Review the full documentation in README.md
4. Check your Node.js version: `node --version` (should be 16+)

## 🎉 Success!

If you see:
- ✅ Login screen loads
- ✅ Can log in successfully  
- ✅ Workflow page displays
- ✅ Connection shows "Live"
- ✅ Can submit application
- ✅ Workflow progresses automatically

**You're all set!** 🚀

Enjoy building with React Workflow Client!

