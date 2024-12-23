import {app, httpRequest, httpResponse} from 'codehooks-js'
import { initAuth } from 'codehooks-auth'
import { settings } from './auth-settings'
import { authenticateToken } from './middleware/userInfo'

const onSignupUser = async (user: any) => {
  console.log('onSignup', user)
  return new Promise((resolve, reject) => {
    if (user.username === 'jones@restdb.io') {
      resolve({...user, active: true})
    } else {
      reject(new Error('User not allowed to sign up'))
    }
  })
}
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


// serve /dist for react frontend
app.static({ route: '/', directory: '/dist', default: 'index.html', notFound: '/index.html' })

// bind to serverless runtime
export default app.init(() => {
  console.log('app initialized')
})
