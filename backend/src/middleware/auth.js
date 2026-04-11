const jwt = require('jsonwebtoken')

function auth(req, res, next) {

  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'You need to be logged in to do this'
      }
    })
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: {
        code: 'BAD_TOKEN_FORMAT',
        message: 'Token format should be: Bearer yourtoken'
      }
    })
  }

  const token = parts[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()

  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired, please login again'
        }
      })
    }

    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token, please login again'
      }
    })
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to do this'
      }
    })
  }
  next()
}

module.exports = { auth, requireAdmin }