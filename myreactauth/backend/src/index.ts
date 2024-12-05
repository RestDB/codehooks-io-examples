import {app, datastore} from 'codehooks-js'
import { initAuth } from 'codehooks-auth'
import { settings } from './auth-settings'
import { authenticateToken } from './middleware/userInfo'

// setup auth settings
initAuth(app, settings)

// setup your api
app.get('/api/hello', (req: any, res) => {
  res.send('Hello World!')
})

app.get('/api/userinfo', authenticateToken, async (req: any, res) => {
    console.log('userinfo', req.jwt_decoded)
    res.json({
      user: req.jwt_decoded
    })
  })

// serve /auth/assets html forms javascripts etc
//app.static({ route: '/auth', directory: '/auth/assets', default: 'login.html' })

// serve /dist for react frontend
app.static({ route: '/', directory: '/dist', default: 'index.html', notFound: '/index.html' })

// bind to serverless runtime
export default app.init()