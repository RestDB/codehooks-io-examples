import {app, datastore} from 'codehooks-js'
import { initAuth } from 'codehooks-auth'
import { settings } from './auth-settings'
import * as cookie from 'cookie'
import * as jwt from 'jsonwebtoken'

// setup auth settings
initAuth(app, settings)

// setup your api
app.get('/api/hello', (req: any, res) => {
  res.send('Hello World!')
})

app.use('/api/userinfo', (req: any, res, next) => {
  let token:string;

  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  if (req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    token = cookies['access-token']
  }
  if (token) {
      try {
          const decoded = jwt.verify(token, settings.JWT_ACCESS_TOKEN_SECRET);
          req.jwt_decoded = decoded;
          console.debug('mid ware verified access token', req.jwt_decoded)
          next()
      } catch (error:any) {
          if (error.name === "TokenExpiredError") {
              return next("Token lifetime exceeded!")               
          }        
          next(error);
      }
  } else {
      next('Missing token')
  }
})

app.get('/api/userinfo', async (req: any, res) => {
    console.log('userinfo', req.jwt_decoded)
    res.json({
      user: req.jwt_decoded
    })
  })

// serve /auth/assets html forms javascripts etc
app.static({ route: '/auth', directory: '/auth/assets', default: 'login.html' })

// serve /dist for frontend
app.static({ route: '/', directory: '/dist', default: 'index.html' })

// bind to serverless runtime
export default app.init()