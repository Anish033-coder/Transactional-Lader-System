const express = require('express')
const { z } = require('zod')
const { register, login } = require('../services/AuthService')

const router = express.Router()

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
})

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

router.post('/register', async function(req, res, next) {


  const result = registerSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your input',
        details: result.error.flatten().fieldErrors
      }
    })
  }

  try {
    const data = await register(result.data.email, result.data.password)
    return res.status(201).json({ data: data })
  } catch (error) {
    next(error)
  }

})

router.post('/login', async function(req, res, next) {

  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your input',
        details: result.error.flatten().fieldErrors
      }
    })
  }

  try {
    const data = await login(result.data.email, result.data.password)
    return res.status(200).json({ data: data })
  } catch (error) {
    next(error)
  }

})

module.exports = router