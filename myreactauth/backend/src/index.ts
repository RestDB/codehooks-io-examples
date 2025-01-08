import {app, httpRequest, httpResponse, Datastore} from 'codehooks-js'
import { initAuth } from 'codehooks-auth'
import { settings } from './auth-settings'
import { authenticateToken } from './middleware/userInfo'

const cacheFunction = (req: httpRequest, res: httpResponse, next: any) => {
  res.set('Cache-Control', `public, max-age=${ONE_DAY}, s-maxage=${ONE_DAY}`)
  res.set('Expires', new Date(Date.now() + ONE_DAY).toUTCString())
  res.removeHeader('Pragma');
  next()
}

settings.staticHook = cacheFunction;
// setup auth settings
initAuth(app, settings)


// setup your api
app.get('/api/hello', (req: any, res) => {
  res.send('Hello World!')
})

app.get('/api/userinfo', authenticateToken, async (req: any, res) => {
    console.log('userinfo', req.jwt_decoded)
    const db = await Datastore.open()
    const user = await db.getOne('users', {email: req.jwt_decoded.email})
    res.json({...user})
  })

const ONE_DAY = 24 * 60 * 60 * 1000;

// serve /dist for react frontend
app.static({ route: '/', directory: '/dist', default: 'index.html', notFound: '/index.html' }, cacheFunction)

// bind to serverless runtime
export default app.init(() => {
  console.log('app initialized')
})
