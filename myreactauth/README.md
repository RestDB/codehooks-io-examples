## GitHub Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: [Your App Name]
   - Homepage URL: http://localhost:3000 (for development)
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github

Save your Client ID and Client Secret for later configuration.

## Google Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Configure Consent Screen"
   - Select "External" user type
   - Fill in required app information (name, email, etc.)
   - Add necessary scopes (typically email and profile)
   - Add test users if needed
5. Return to Credentials page and click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: Web application
   - Name: [Your App Name]
   - Authorized JavaScript origins: http://localhost:3000
   - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
6. Click "Create"

Save your Client ID and Client Secret for later configuration.

## Project Setup and Configuration

In progress ...


