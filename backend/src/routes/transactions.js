const express = require('express')
const { z } = require('zod')
const { auth } = require('../middleware/auth')
const { transfer, deposit } = require('../services/TransactionService')
const { db } = require('../db/db')

const router = express.Router()

router.post('/transfer', auth, async function(req, res, next) {

  const schema = z.object({
    fromAccountId: z.string().uuid('fromAccountId must be a valid UUID'),
    toAccountId: z.string().uuid('toAccountId must be a valid UUID'),

    amount: z.string().regex(
      /^\d+(\.\d{1,8})?$/,
      'Amount must be a valid number with up to 8 decimal places'
    ),

    note: z.string().max(200, 'Note cannot be longer than 200 characters').optional()
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
    const data = await transfer(
      result.data.fromAccountId,
      result.data.toAccountId,
      result.data.amount,
      result.data.note,
      req.user.userId     
    )

    return res.status(201).json({ data: data })

  } catch (error) {
    next(error)
  }

})

router.post('/deposit', auth, async function(req, res, next) {

  const schema = z.object({
    accountId: z.string().uuid('accountId must be a valid UUID'),
    amount: z.string().regex(
      /^\d+(\.\d{1,8})?$/,
      'Amount must be a valid number'
    ),
    note: z.string().max(200).optional()
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
    const data = await deposit(
      result.data.accountId,
      result.data.amount,
      result.data.note,
      req.user.userId
    )

    return res.status(201).json({ data: data })

  } catch (error) {
    next(error)
  }

})

router.get('/', auth, async function(req, res, next) {

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20

  const safeLimitedLimit = Math.min(limit, 100)

  const offset = (page - 1) * safeLimitedLimit

  try {
    const myAccounts = await db('accounts')
      .where({ user_id: req.user.userId })
      .select('id')

    const myAccountIds = myAccounts.map(function(account) {
      return account.id
    })

    if (myAccountIds.length === 0) {
      return res.status(200).json({
        data: {
          transactions: [],
          pagination: {
            page: page,
            limit: safeLimitedLimit,
            total: 0,
            totalPages: 0,
            hasNext: false
          }
        }
      })
    }

    const transactions = await db('transactions')
      .whereIn('from_account_id', myAccountIds)
      .orWhereIn('to_account_id', myAccountIds)
      .orderBy('created_at', 'desc')
      .limit(safeLimitedLimit)
      .offset(offset)
      .select('*')

    const countResult = await db('transactions')
      .whereIn('from_account_id', myAccountIds)
      .orWhereIn('to_account_id', myAccountIds)
      .count('id as total')
      .first()

    const total = parseInt(countResult.total)
    const totalPages = Math.ceil(total / safeLimitedLimit)

    return res.status(200).json({
      data: {
        transactions: transactions,
        pagination: {
          page: page,
          limit: safeLimitedLimit,
          total: total,
          totalPages: totalPages,
          hasNext: page < totalPages
        }
      }
    })

  } catch (error) {
    next(error)
  }

})

module.exports = router