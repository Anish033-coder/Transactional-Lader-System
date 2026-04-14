const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const accountRoutes = require('./routes/accounts')
const transactionRoutes = require('./routes/transactions')

const app = express()

app.use(cors())

app.use(express.json())

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    time: new Date().toISOString()
  })
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/accounts', accountRoutes)
app.use('/api/v1/transactions', transactionRoutes)

app.use(function(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'This endpoint does not exist'
    }
  })
})

app.use(function(err, req, res, next) {

  console.error('Error:', err.message)

  const statusCodes = {
    'INSUFFICIENT_FUNDS':  402,
    'ACCOUNT_NOT_FOUND':   404,
    'DEST_NOT_FOUND':      404,
    'INVALID_AMOUNT':      422,
    'SAME_ACCOUNT':        422,
    'VALIDATION_ERROR':    422,
    'EMAIL_TAKEN':         409,
    'INVALID_CREDENTIALS': 401,
    'FORBIDDEN':           403,
    'ACCOUNT_INACTIVE':    422,
    'DEST_INACTIVE':       422,
  }

  const statusCode = statusCodes[err.code] || 500

  const message = statusCode === 500
    ? 'Something went wrong on our end'
    : err.message

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: message
    }
  })

})

const PORT = process.env.PORT || 3001

app.listen(PORT, function() {
  console.log('Server started on port ' + PORT)
  console.log('Health check: http://localhost:' + PORT + '/health')
})