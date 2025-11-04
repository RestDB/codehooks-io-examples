# Usage Instructions

## 🎯 How to Use This Application

### For End Users

#### Logging In

1. **Navigate to the application**
   - Open `http://localhost:3000` in your browser
   - You'll see the login screen

2. **Choose a login method**
   
   **Option A: Demo Login (Quick)**
   - Click the "Try Demo Login" button
   - You'll be logged in instantly as John Doe
   
   **Option B: Manual Login**
   - Enter any email address (e.g., `sarah.smith@company.com`)
   - Enter any password (e.g., `password123`)
   - Click "Login"
   
   > Note: This is a mock authentication system. Any credentials work for demo purposes.

#### Submitting a Workflow Request

1. **After login, you'll see the Workflow page**
   - Check the connection status in the header (should show 🟢 Live)
   - You'll see 5 steps at the top showing the workflow progress

2. **Fill out the equipment request form**
   
   **Equipment Type:**
   - Select from dropdown: Laptop, Desktop, Monitor, Phone, or Tablet
   
   **Justification (Required):**
   - Explain why you need this equipment
   - Example: "My current laptop is 5 years old and can't run the latest development tools"
   
   **Specifications (Optional):**
   - Add any specific requirements
   - Example: "Need 16GB RAM minimum for Docker containers"

3. **Submit your application**
   - Click "Submit Application"
   - The page will change to show "Awaiting Company Approval"
   - A loading spinner indicates the system is waiting

4. **Wait for approval** (automatic)
   - The backend will process your request
   - With mock server: takes 3-5 seconds
   - With real backend: depends on actual approval process
   - The page will automatically update when a decision is made

#### If Approved - Making Your Choice

1. **You'll see a success message**
   - "Good news! Your application has been approved"

2. **Select your preferred configuration**
   - **Standard**: Basic specs, fastest approval
   - **Professional**: Medium specs, good balance
   - **Premium**: High-end specs, lower approval rate

3. **Submit your choice**
   - Click "Submit Choice"
   - The page changes to "Final Review in Progress"

4. **Wait for final decision** (automatic)
   - Takes 2-4 seconds with mock server
   - Page updates automatically with result

#### Final Result

**If Approved:**
- ✅ Green checkmark icon
- "Application Approved!" message
- Expected delivery timeline
- "Start New Application" button to reset

**If Denied:**
- ❌ Red X icon
- "Application Denied" message
- Reason for denial (if provided)
- "Start New Application" button to try again

#### Activity Log

- Scroll down to see complete workflow history
- Shows timestamps for all events
- Useful for tracking your request

#### Logging Out

1. Click your avatar/initials in the top-right corner
2. Click "Logout" in the dropdown menu
3. You'll be redirected to the login screen

---

### For Developers

#### Starting the Application

**Development Mode:**
```bash
# Terminal 1: Start mock backend
npm run mock-server

# Terminal 2: Start React app
npm run dev

# Access at http://localhost:3000
```

**Production Build:**
```bash
npm run build
npm run preview
```

#### Testing Different Scenarios

**Test Denied Application:**

With the mock server, 20% of applications are denied. Keep submitting until you get a denial.

**Test Different Configurations:**

Try submitting:
- Standard (95% approval)
- Professional (90% approval)
- Premium (60% approval)

**Test Connection Loss:**

1. Stop the mock server (`Ctrl+C`)
2. Watch the status change to "Offline"
3. Restart to reconnect

**Test Without Backend:**

1. Start only the React app: `npm run dev`
2. App will show "Offline" but UI still works
3. Submissions will fail gracefully

#### Customizing Behavior

**Change Approval Timing:**

Edit `mock-server.js`:
```javascript
const approvalTime = 3000 // Change to 1000 for 1 second
```

**Change Approval Rate:**

Edit `mock-server.js`:
```javascript
const approved = Math.random() > 0.2 // Change 0.2 to 0.5 for 50% approval
```

**Change Available Equipment:**

Edit `src/pages/Workflow.jsx`:
```javascript
<option value="laptop">Laptop Computer</option>
<option value="your-item">Your New Item</option>
```

**Change Configuration Options:**

Edit the user choice section in `src/pages/Workflow.jsx`:
```javascript
<label className="label cursor-pointer border rounded-lg p-4">
  <span className="label-text">
    <div className="font-semibold">Your Config Name</div>
    <div className="text-sm opacity-70">Your specs</div>
  </span>
  <input type="radio" name="choice" value="your-value" />
</label>
```

#### Connecting to Real Backend

1. **Set up your codehooks.io project**
2. **Deploy your backend code**
3. **Update `.env` file:**
   ```env
   VITE_API_URL=https://your-app.codehooks.io
   VITE_API_TOKEN=your-real-token
   ```
4. **Restart the app:** `npm run dev`

#### Monitoring Events

**Browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "EventSource" or look for "workflow"
4. Click on the connection
5. Go to "EventStream" or "Messages" tab
6. Watch real-time events

**Console Logs:**

The app logs all events to console:
```javascript
// In browser console:
console.log('Received workflow event:', data)
console.log('Connection status:', status)
```

**Mock Server Logs:**

The mock server prints activity:
```
✅ New listener created: listener-123
📝 Application submitted by John Doe
✅ Application approved for listener: listener-123
```

---

### For Administrators

#### Deployment

**Build for Production:**
```bash
npm run build
# Output in ./dist directory
```

**Deploy to Static Hosting:**

The built app can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting

**Environment Variables in Production:**

Ensure your hosting platform has these variables:
```
VITE_API_URL=https://your-production-backend.com
VITE_API_TOKEN=production-token
```

#### Monitoring

**Check Connection Status:**
- Green dot = Connected to backend
- Red dot = Disconnected

**Activity Log:**
- All users can see their own activity
- Consider adding admin panel for all activities

**Error Handling:**
- Check browser console for client errors
- Check backend logs for server errors
- Check network tab for failed requests

---

### Common Workflows

#### First-Time User
1. Open app
2. Click "Try Demo Login"
3. Read the instructions
4. Fill out form
5. Submit
6. Wait for approval
7. Make choice
8. See result

#### Testing Different Outcomes
1. Submit multiple applications
2. Try different equipment types
3. Try different configurations
4. Check activity log
5. Reset and try again

#### Developer Testing
1. Start mock server
2. Start React app
3. Open DevTools
4. Submit application
5. Watch network events
6. Check console logs
7. Verify state updates

---

### Tips & Tricks

**Quick Testing:**
- Use Demo Login for fastest access
- Mock server provides realistic delays
- Activity log shows all events

**Debugging:**
- Open browser console first
- Check Network > EventSource
- Verify backend is running
- Check .env variables

**Customization:**
- Modify daisyUI theme
- Change workflow steps
- Add more form fields
- Customize validation

**Best Practices:**
- Keep browser DevTools open during development
- Test with slow network (DevTools throttling)
- Test on mobile viewport
- Clear localStorage if issues: `localStorage.clear()`

---

### Troubleshooting

**Problem: Can't login**
- Solution: Any credentials work, try clicking Demo Login

**Problem: Status shows Offline**
- Solution: Start mock server with `npm run mock-server`

**Problem: Workflow doesn't progress**
- Solution: Check DevTools Network tab for event stream

**Problem: Port already in use**
- Solution: Kill process or change port in config

**Problem: Changes not showing**
- Solution: Clear browser cache and refresh

**Problem: Events not received**
- Solution: Check mock-server.js is running and check console

---

### Getting Help

1. Check **QUICKSTART.md** for setup help
2. Check **README.md** for technical details
3. Check **DEVELOPMENT.md** for dev tips
4. Check **PROJECT_OVERVIEW.md** for architecture
5. Check browser console for errors
6. Check codehooks.io documentation

---

**Happy workflow managing!** 🎉

