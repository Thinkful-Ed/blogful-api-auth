const AuthService = require('../auth/auth-service')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''

  let bearerToken
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  } else {
    bearerToken = authToken.slice(7, authToken.length)
  }

  const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(bearerToken)

  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' })
  }

  AuthService.getUserWithUserName(
    req.app.get('db'),
    tokenUserName
  )
    .then(user => {
      if (!user || user.password !== tokenPassword) {
        return res.status(401).json({ error: 'Unauthorized request' })
      }

      next()
    })
    .catch(next)
}

module.exports = {
  requireAuth,
}
