const { db } = require('../db/db')

async function runReconciliation() {

  console.log('Running reconciliation at:', new Date().toISOString())

  const [balanceMismatches, unbalancedTransactions, stuckTransactions] =
    await Promise.all([
      checkBalanceMismatches(),
      checkUnbalancedTransactions(),
      checkStuckTransactions()
    ])

  const isHealthy = balanceMismatches.length === 0
                 && unbalancedTransactions.length === 0

  const report = {
    healthy:               isHealthy,
    ran_at:                new Date().toISOString(),
    balance_mismatches:    balanceMismatches,
    unbalanced_transactions: unbalancedTransactions,
    stuck_transactions:    stuckTransactions,
    summary: {

      balance_mismatch_count:    balanceMismatches.length,
      unbalanced_txn_count:      unbalancedTransactions.length,
      stuck_txn_count:           stuckTransactions.length
    }
  }

  console.log('Reconciliation complete. Healthy:', isHealthy)

  return report
}
async function checkBalanceMismatches() {


  const result = await db.raw(`
    SELECT
      a.id                    AS account_id,
      a.name                  AS account_name,
      a.balance               AS stored_balance,
      COALESCE(
        SUM(
          CASE
            WHEN le.entry_type = 'CREDIT' THEN le.amount
            WHEN le.entry_type = 'DEBIT'  THEN -le.amount
            ELSE 0
          END
        ),
        0
      )                       AS ledger_sum,
      ABS(
        a.balance - COALESCE(
          SUM(
            CASE
              WHEN le.entry_type = 'CREDIT' THEN le.amount
              WHEN le.entry_type = 'DEBIT'  THEN -le.amount
              ELSE 0
            END
          ),
          0
        )
      )                       AS discrepancy
    FROM accounts a
    LEFT JOIN ledger_entries le ON le.account_id = a.id
    GROUP BY a.id, a.name, a.balance
    HAVING ABS(
      a.balance - COALESCE(
        SUM(
          CASE
            WHEN le.entry_type = 'CREDIT' THEN le.amount
            WHEN le.entry_type = 'DEBIT'  THEN -le.amount
            ELSE 0
          END
        ),
        0
      )
    ) > 0.000001
    ORDER BY discrepancy DESC
  `)

  return result.rows
}

async function checkUnbalancedTransactions() {


  const result = await db.raw(`
    SELECT
      t.id                AS transaction_id,
      t.amount            AS transaction_amount,
      t.type              AS transaction_type,
      t.created_at,
      SUM(
        CASE WHEN le.entry_type = 'DEBIT'  THEN le.amount ELSE 0 END
      )                   AS total_debits,
      SUM(
        CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE 0 END
      )                   AS total_credits,
      ABS(
        SUM(CASE WHEN le.entry_type = 'DEBIT'  THEN le.amount ELSE 0 END) -
        SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE 0 END)
      )                   AS imbalance
    FROM transactions t
    JOIN ledger_entries le ON le.transaction_id = t.id
    WHERE t.type = 'TRANSFER'
    GROUP BY t.id, t.amount, t.type, t.created_at
    HAVING ABS(
      SUM(CASE WHEN le.entry_type = 'DEBIT'  THEN le.amount ELSE 0 END) -
      SUM(CASE WHEN le.entry_type = 'CREDIT' THEN le.amount ELSE 0 END)
    ) > 0.000001
    ORDER BY imbalance DESC
  `)

  return result.rows
}

async function checkStuckTransactions() {


  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const stuckTxns = await db('transactions')
    .where({ status: 'PENDING' })
    .where('created_at', '<', fiveMinutesAgo)
    .select('id', 'from_account_id', 'to_account_id', 'amount', 'created_at')
    .orderBy('created_at', 'asc')

  return stuckTxns
}

module.exports = { runReconciliation }