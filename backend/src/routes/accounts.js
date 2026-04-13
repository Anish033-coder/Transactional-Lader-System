const express = require('express')
const { z } = require('zod')
const { auth } = require('../middleware/auth')
const { db } = require('../db/db')

const router = express.Router()

router.get('/', auth, async function(req, res, next) {

  try {

    const accounts = await db('accounts')
      .where({ user_id: req.user.userId })
      .select('id', 'name', 'balance', 'currency', 'status', 'created_at')
      .orderBy('created_at', 'asc')

    return res.status(200).json({
      data: {
        accounts: accounts
      }
    })

  } catch (error) {
    next(error)
  }

})

router.post('/', auth, async function(req, res, next) {

  const schema = z.object({
    name: z.string().min(1, 'Account name is required').max(100, 'Name too long'),
    currency: z.enum(['INR', 'USD', 'EUR'], {
      errorMap: () => ({ message: 'Currency must be INR, USD, or EUR' })
    }).optional().default('INR')
  })

  const result = schema.safeParse(req.body)

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
    const newAccounts = await db('accounts')
      .insert({
        user_id: req.user.userId,
        name: result.data.name,
        balance: 0,
        currency: result.data.currency
      })
      .returning(['id', 'name', 'balance', 'currency', 'status', 'created_at'])

    return res.status(201).json({
      data: {
        account: newAccounts[0]
      }
    })

  } catch (error) {
    next(error)
  }

})

router.get('/:id', auth, async function(req, res, next) {

  try {
    const account = await db('accounts')
      .where({
        id: req.params.id,
        user_id: req.user.userId   
      })
      .select('id', 'name', 'balance', 'currency', 'status', 'created_at')
      .first()

    if (!account) {
      return res.status(404).json({
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        }
      })
    }

    return res.status(200).json({
      data: { account: account }
    })

  } catch (error) {
    next(error)
  }

})

module.exports = router