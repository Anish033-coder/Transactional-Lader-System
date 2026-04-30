
const BASE_URL = import.meta.env.VITE_API_URL

async function request(method, path, body, idempotencyKey) {


  const headers = {
    'Content-Type': 'application/json'
  }

    const token = localStorage.getItem('token')

  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await fetch(BASE_URL + path, {
    method: method,
    headers: headers,
   body: body ? JSON.stringify(body) : undefined
  })

const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Something went wrong')
    error.code = data.error?.code
    throw error
  }

 return data
}

function generateKey() {
  return crypto.randomUUID()
}

export async function registerUser(email, password) {
  return request('POST', '/auth/register', { email, password })
}

export async function loginUser(email, password) {
  return request('POST', '/auth/login', { email, password })
}

export async function getAccounts() {
  return request('GET', '/accounts')
}

export async function getAccount(id) {
  return request('GET', '/accounts/' + id)
}

export async function createAccount(name, currency) {
  return request('POST', '/accounts', { name, currency })
}

export async function getTransactions(page, limit) {
 const queryString = '?page=' + (page || 1) + '&limit=' + (limit || 20)
  return request('GET', '/transactions' + queryString)
}

export async function transferMoney(fromAccountId, toAccountId, amount, note) {
  const idempotencyKey = generateKey()
  return request(
    'POST',
    '/transactions/transfer',
    { fromAccountId, toAccountId, amount, note },
    idempotencyKey  
  )
}

export async function depositMoney(accountId, amount, note) {
  const idempotencyKey = generateKey()
  return request(
    'POST',
    '/transactions/deposit',
    { accountId, amount, note },
    idempotencyKey
  )
}

export async function getAccountHistory(accountId, page, limit) {
  const queryString = '?page=' + (page || 1) + '&limit=' + (limit || 20)
  return request('GET', '/transactions/accounts/' + accountId + '/history' + queryString)
}

export async function runReconciliation() {
  return request('GET', '/reconciliation/run')
}