const YOUR_APP_URL = 'fortuitous-expanse-a616.codehooks.io'

export const settings = {
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
    JWT_ACCESS_TOKEN_SECRET_EXPIRE: '1h',
    JWT_REFRESH_TOKEN_SECRET_EXPIRE: '7d',
    //redirectSuccessUrl: 'http://localhost:5173/userinfo',
    redirectSuccessUrl: '/userinfo',
    baseAPIRoutes: '/api',
    google: {
        CLIENT_ID: process.env.CLIENT_ID,
        CLIENT_SECRET: process.env.CLIENT_SECRET,
        REDIRECT_URI: `https://${YOUR_APP_URL}/auth/oauthcallback/google`
    },
    github: {
        CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        REDIRECT_URI: `https://${YOUR_APP_URL}/auth/oauthcallback/github`
    },
    mailgun: {
        API_KEY: process.env.MAILGUN_API_KEY,
        DOMAIN: process.env.MAILGUN_DOMAIN,
        FROM_EMAIL: 'jones@restdb.io',
        FROM_NAME: 'RestDB auth team'
    },
    labels: {
        signinTitle: 'Sign in to my app',
        signupTitle: 'Sign up for my app',
        forgotTitle: 'Forgot password',
        otpTitle: 'OTP',
    }
}
