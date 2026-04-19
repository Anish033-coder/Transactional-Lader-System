const express = require('express')
const { z } = require('zod')
const { auth } = require('../middleware/auth')
const { transfer, deposit } = require('../services/TransactionService')
const { db } = require('../db/db')

const router = express.Router()

router.post('/transfer', auth, async function(req, res, next) {

  const idempotencyKey = req.headers['idempotency-key'] || null

  const schema = z.object({
    fromAccountId: z.string().uuid('fromAccountId must be a valid UUID'),
    toAccountId:   z.string().uuid('toAccountId must be a valid UUID'),
    amount:        z.string().regex(
                     /^\d+(\.\d{1,8})?$/,
                     'Amount must be a valid positive number'
                   ),
    note:          z.string().max(200).optional()
  })

  const result = schema.safeParse(req.body)

  if (!result.success) {
    return res.status(422).json({
      error: {
        code:    'VALIDATION_ERROR',
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
      req.user.userId,
      idempotencyKey       
    )

    if (data.replayed) {
      res.setHeader('X-Idempotent-Replayed', 'true')
    }

    return res.status(201).json({ data: data })

  } catch (error) {
    next(error)
  }

})

router.post('/deposit', auth, async function(req, res, next) {

  const idempotencyKey = req.headers['idempotency-key'] || null

  const schema = z.object({
    accountId: z.string().uuid('accountId must be a valid UUID'),
    amount:    z.string().regex(/^\d+(\.\d{1,8})?$/, 'Amount must be a valid number'),
    note:      z.string().max(200).optional()
  })

  const result = schema.safeParse(req.body)

  if (!result.success) {
    return res.status(422).json({
      error: {
        code:    'VALIDATION_ERROR',
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
      req.user.userId,
      idempotencyKey
    )

    if (data.replayed) {
      res.setHeader('X-Idempotent-Replayed', 'true')
    }

    return res.status(201).json({ data: data })

  } catch (error) {
    next(error)
  }

})

router.get('/', auth, async function(req, res, next) {

  const page  = parseInt(req.query.page)  || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const offset = (page - 1) * limit

  try {

    const myAccounts = await db('accounts')
      .where({ user_id: req.user.userId })
      .select('id')

    const myAccountIds = myAccounts.map(function(a) { return a.id })

    if (myAccountIds.length === 0) {
      return res.status(200).json({
        data: {
          transactions: [],
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false }
        }
      })
    }

    const transactions = await db('transactions')
      .whereIn('from_account_id', myAccountIds)
      .orWhereIn('to_account_id', myAccountIds)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('*')

    const countResult = await db('transactions')
      .whereIn('from_account_id', myAccountIds)
      .orWhereIn('to_account_id', myAccountIds)
      .count('id as total')
      .first()

    const total      = parseInt(countResult.total)
    const totalPages = Math.ceil(total / limit)

    return res.status(200).json({
      data: {
        transactions,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages }
      }
    })

  } catch (error) {
    next(error)
  }

})

router.get('/accounts/:id/history', auth, async function(req, res, next) {

  const page   = parseInt(req.query.page)  || 1
  const limit  = Math.min(parseInt(req.query.limit) || 20, 100)
  const offset = (page - 1) * limit

  try {

    const account = await db('accounts')
      .where({
        id:      req.params.id,
        user_id: req.user.userId
      })
      .first()

    if (!account) {
      return res.status(404).json({
        error: {
          code:    'ACCOUNT_NOT_FOUND',
          message: 'Account not found or does not belong to you'
        }
      })
    }

    const entries = await db('ledger_entries')
      .where('ledger_entries.account_id', req.params.id)
      .join(
        'transactions',
        'transactions.id',
        'ledger_entries.transaction_id'
      )
      .orderBy('ledger_entries.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select(
        'ledger_entries.id',
        'ledger_entries.entry_type',
        'ledger_entries.amount',
        'ledger_entries.balance_after',
        'ledger_entries.created_at',
        'transactions.type         as transaction_type',
        'transactions.note         as note',
        'transactions.from_account_id',
        'transactions.to_account_id'
      )

    const countResult = await db('ledger_entries')
      .where({ account_id: req.params.id })
      .count('id as total')
      .first()

    const total      = parseInt(countResult.total)
    const totalPages = Math.ceil(total / limit)

    return res.status(200).json({
      data: {
        account: {
          id:       account.id,
          name:     account.name,
          balance:  account.balance,
          currency: account.currency
        },
        entries,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages }
      }
    })

  } catch (error) {
    next(error)
  }

})

module.exports = router