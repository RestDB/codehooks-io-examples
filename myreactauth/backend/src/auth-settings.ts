import {AuthSettings} from 'codehooks-auth'

const YOUR_APP_URL = 'fortuitous-expanse-a616.codehooks.io'; // replace with your app url

export const settings: AuthSettings = {
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,
    JWT_ACCESS_TOKEN_SECRET_EXPIRE: '1h',
    JWT_REFRESH_TOKEN_SECRET_EXPIRE: '7d',
    //redirectSuccessUrl: 'http://localhost:5173/userinfo',
    baseUrl: 'https://fortuitous-expanse-a616.codehooks.io',
    redirectSuccessUrl: '/userinfo',
    redirectFailUrl: '/auth/login',
    baseAPIRoutes: '/api',
    github: {
        CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        REDIRECT_URI: `https://${YOUR_APP_URL}/auth/oauthcallback/github`
    },
    google: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URI: `https://${YOUR_APP_URL}/auth/oauthcallback/google`
    },
    emailProvider: 'mailgun',
    emailSettings: {
        mailgun: {
            MAILGUN_APIKEY: process.env.MAILGUN_APIKEY,
            MAILGUN_DOMAIN: 'mg.restdb.io',
            MAILGUN_FROM_EMAIL: 'jones@restdb.io',
            MAILGUN_FROM_NAME: 'Mjau voff - Auth team'
        }
    },
    labels: {
        signinTitle: 'Sign in to my app',
        signupTitle: 'Welcome to my app',
        forgotTitle: 'Forgot password',
        otpTitle: 'One time password',
    }
}
