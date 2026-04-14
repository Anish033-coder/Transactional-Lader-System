const { db } = require('../db/db')

async function transfer(fromAccountId, toAccountId, amount, note, userId) {

  const transferAmount = parseFloat(amount)

  if (transferAmount <= 0) {
    const error = new Error('Amount must be greater than zero')
    error.code = 'INVALID_AMOUNT'
    throw error
  }

  if (fromAccountId === toAccountId) {
    const error = new Error('You cannot transfer to the same account')
    error.code = 'SAME_ACCOUNT'
    throw error
  }

  const transaction = await db.transaction(async function(trx) {

    const fromAccount = await trx('accounts')
      .where({
        id: fromAccountId,
        user_id: userId
      })
      .first()

    if (!fromAccount) {
      const error = new Error('Source account not found or does not belong to you')
      error.code = 'ACCOUNT_NOT_FOUND'
      throw error
    }

    if (fromAccount.status !== 'ACTIVE') {
      const error = new Error('Your account is not active')
      error.code = 'ACCOUNT_INACTIVE'
      throw error
    }

    const toAccount = await trx('accounts')
      .where({ id: toAccountId })
      .first()

    if (!toAccount) {
      const error = new Error('Destination account not found')
      error.code = 'DEST_NOT_FOUND'
      throw error
    }

    if (toAccount.status !== 'ACTIVE') {
      const error = new Error('Destination account is not active')
      error.code = 'DEST_INACTIVE'
      throw error
    }

    const currentBalance = parseFloat(fromAccount.balance)

    if (currentBalance < transferAmount) {
      const error = new Error('You do not have enough balance for this transfer')
      error.code = 'INSUFFICIENT_FUNDS'
      throw error
    }

    const newFromBalance = currentBalance - transferAmount
    const newToBalance = parseFloat(toAccount.balance) + transferAmount

    await trx('accounts')
      .where({ id: fromAccountId })
      .update({
        balance: newFromBalance.toFixed(8),  
        updated_at: new Date()
      })

    await trx('accounts')
      .where({ id: toAccountId })
      .update({
        balance: newToBalance.toFixed(8),
        updated_at: new Date()
      })

    const newTransactions = await trx('transactions')
      .insert({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: transferAmount.toFixed(8),
        type: 'TRANSFER',
        status: 'COMPLETED',
        note: note || null,
        completed_at: new Date()
      })
      .returning('*')

    return {
      transaction: newTransactions[0],
      newBalance: newFromBalance.toFixed(8)
    }

  })

  return transaction
}

async function deposit(accountId, amount, note, userId) {

  const depositAmount = parseFloat(amount)

  if (depositAmount <= 0) {
    const error = new Error('Amount must be greater than zero')
    error.code = 'INVALID_AMOUNT'
    throw error
  }

  const result = await db.transaction(async function(trx) {

    const account = await trx('accounts')
      .where({
        id: accountId,
        user_id: userId
      })
      .first()

    if (!account) {
      const error = new Error('Account not found or does not belong to you')
      error.code = 'ACCOUNT_NOT_FOUND'
      throw error
    }

    if (account.status !== 'ACTIVE') {
      const error = new Error('Account is not active')
      error.code = 'ACCOUNT_INACTIVE'
      throw error
    }

    const newBalance = parseFloat(account.balance) + depositAmount

    await trx('accounts')
      .where({ id: accountId })
      .update({
        balance: newBalance.toFixed(8),
        updated_at: new Date()
      })

    const newTransactions = await trx('transactions')
      .insert({
        from_account_id: null,      
        to_account_id: accountId,
        amount: depositAmount.toFixed(8),
        type: 'DEPOSIT',
        status: 'COMPLETED',
        note: note || null,
        completed_at: new Date()
      })
      .returning('*')

    return {
      transaction: newTransactions[0],
      newBalance: newBalance.toFixed(8)
    }

  })

  return result
}

module.exports = { transfer, deposit }