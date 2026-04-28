// load test script
// this proves that our SELECT FOR UPDATE works correctly
//
// what this test does:
//   1. registers two test users (anish and rahul)
//   2. deposits 10000 rupees into anish's account
//   3. fires 20 concurrent transfer requests of 100 rupees each
//      from anish to rahul AT THE SAME TIME
//   4. waits for all to finish
//   5. checks the final balances
//
// what CORRECT behavior looks like:
//   anish started with 10000, sent 100 x 20 = 2000
//   anish final balance: 8000
//   rahul final balance: 2000 (he started with 0)
//   total money: 10000 (unchanged - no money created or destroyed)
//
// without SELECT FOR UPDATE (Phase 1):
//   some transfers might read the same balance simultaneously
//   and both think there is enough money when there isn't
//   result: incorrect balances, money created out of nothing
//
// with SELECT FOR UPDATE (Phase 2):
//   all transfers are serialized correctly
//   result: exact balances every single time

const BASE_URL = 'http://localhost:3001/api/v1'

// simple fetch wrapper
async function post(path, body, token, idempotencyKey) {
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await fetch(BASE_URL + path, {
    method:  'POST',
    headers: headers,
    body:    JSON.stringify(body)
  })

  return response.json()
}

async function get(path, token) {
  const response = await fetch(BASE_URL + path, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  return response.json()
}

// generate a random unique string for idempotency keys and email
function randomId() {
  return Math.random().toString(36).substring(2, 15)
}

async function runLoadTest() {

  console.log('=== PHASE 2 LOAD TEST ===')
  console.log('Testing SELECT FOR UPDATE concurrency safety\n')

  // ── SETUP ──────────────────────────────────────────────

  // register anish (sender)
  const anishEmail = 'anish_' + randomId() + '@test.com'
  const anishReg   = await post('/auth/register', {
    email:    anishEmail,
    password: 'password123'
  })

  if (!anishReg.data) {
    console.error('Failed to register anish:', anishReg)
    return
  }

  const anishToken     = anishReg.data.token
  const anishAccountId = anishReg.data.account.id
  console.log('Registered anish. Account ID:', anishAccountId)

  // register rahul (receiver)
  const rahulEmail = 'rahul_' + randomId() + '@test.com'
  const rahulReg   = await post('/auth/register', {
    email:    rahulEmail,
    password: 'password123'
  })

  const rahulAccountId = rahulReg.data.account.id
  console.log('Registered rahul. Account ID:', rahulAccountId)

  // deposit 10000 rupees into anish's account
  await post('/transactions/deposit', {
    accountId: anishAccountId,
    amount:    '10000',
    note:      'Initial deposit for load test'
  }, anishToken, 'deposit-' + randomId())

  console.log('Deposited 10000 into anish account')
  console.log('\nFiring 20 concurrent transfers of 100 rupees each...')

  // ── LOAD TEST ──────────────────────────────────────────

  const TRANSFER_COUNT  = 20
  const TRANSFER_AMOUNT = '100'

  // create all 20 transfer promises at the same time
  // Promise.allSettled waits for ALL to finish even if some fail
  const startTime = Date.now()

  const transferPromises = []

  for (let i = 0; i < TRANSFER_COUNT; i++) {
    // each transfer has a unique idempotency key
    const promise = post('/transactions/transfer', {
      fromAccountId: anishAccountId,
      toAccountId:   rahulAccountId,
      amount:        TRANSFER_AMOUNT,
      note:          'Load test transfer ' + (i + 1)
    }, anishToken, 'transfer-' + randomId())

    transferPromises.push(promise)
  }

  // fire all 20 AT THE SAME TIME
  const results = await Promise.allSettled(transferPromises)

  const endTime     = Date.now()
  const duration    = endTime - startTime

  // count successes and failures
  let successCount = 0
  let failCount    = 0

  results.forEach(function(result) {
    if (result.status === 'fulfilled' && result.value.data) {
      successCount++
    } else {
      failCount++
    }
  })

  console.log('\n=== RESULTS ===')
  console.log('Duration:          ', duration + 'ms')
  console.log('Successful:        ', successCount, '/ ' + TRANSFER_COUNT)
  console.log('Failed:            ', failCount, '/ ' + TRANSFER_COUNT)

  // ── VERIFY BALANCES ────────────────────────────────────

  // get final balances
  const anishAccounts = await get('/accounts', anishToken)
  const rahulAccounts = await get('/accounts', rahulReg.data.token)

  const anishBalance = parseFloat(anishAccounts.data.accounts[0].balance)
  const rahulBalance = parseFloat(rahulAccounts.data.accounts[0].balance)
  const totalMoney   = anishBalance + rahulBalance

  const expectedAnishBalance = 10000 - (successCount * 100)
  const expectedRahulBalance = successCount * 100
  const expectedTotal        = 10000

  console.log('\n=== BALANCE VERIFICATION ===')
  console.log('Anish final balance: ', anishBalance)
  console.log('Rahul final balance: ', rahulBalance)
  console.log('Total money in system:', totalMoney)

  console.log('\n=== ASSERTIONS ===')

  // ASSERTION 1: no money created or destroyed
  if (Math.abs(totalMoney - expectedTotal) < 0.01) {
    console.log('PASS - Total money conserved:', totalMoney, '=== 10000')
  } else {
    console.log('FAIL - Money was created or destroyed!')
    console.log('       Expected:', expectedTotal, ' Got:', totalMoney)
  }

  // ASSERTION 2: anish balance is correct
  if (Math.abs(anishBalance - expectedAnishBalance) < 0.01) {
    console.log('PASS - Anish balance correct:', anishBalance)
  } else {
    console.log('FAIL - Anish balance wrong!')
    console.log('       Expected:', expectedAnishBalance, ' Got:', anishBalance)
  }

  // ASSERTION 3: rahul balance is correct
  if (Math.abs(rahulBalance - expectedRahulBalance) < 0.01) {
    console.log('PASS - Rahul balance correct:', rahulBalance)
  } else {
    console.log('FAIL - Rahul balance wrong!')
    console.log('       Expected:', expectedRahulBalance, ' Got:', rahulBalance)
  }

  // ASSERTION 4: no negative balances
  if (anishBalance >= 0 && rahulBalance >= 0) {
    console.log('PASS - No negative balances')
  } else {
    console.log('FAIL - Negative balance detected!')
  }

  // run reconciliation to verify ledger integrity
  console.log('\n=== RECONCILIATION CHECK ===')
  const reconciliation = await get('/reconciliation/run', anishToken)

  if (reconciliation.data.healthy) {
    console.log('PASS - Reconciliation passed. Ledger is balanced.')
  } else {
    console.log('FAIL - Reconciliation found issues:')
    console.log(JSON.stringify(reconciliation.data, null, 2))
  }

  console.log('\n=== LOAD TEST COMPLETE ===')
}

// run the test
runLoadTest().catch(function(err) {
  console.error('Load test failed:', err.message)
})