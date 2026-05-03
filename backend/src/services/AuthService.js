require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../db/db')


async function register(email, password) {
  const existingUser = await db('users').where({ email: email }).first()

  if (existingUser) {
    const error = new Error('This email is already registered')
    error.code = 'EMAIL_TAKEN'
    throw error
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const newUsers = await db('users')
    .insert({
      email: email,
      password_hash: passwordHash
    })
    .returning(['id', 'email', 'role'])

  const user = newUsers[0]

  const newAccounts = await db('accounts')
    .insert({
      user_id: user.id,
      name: 'Main Account',
      balance: 0,
      currency: 'INR'
    })
    .returning(['id', 'name', 'balance', 'currency', 'status'])

  const account = newAccounts[0]

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'  
    }
  )

  return {
    user: user,
    account: account,
    token: token
  }
}

async function login(email, password) {

  const user = await db('users').where({ email: email }).first()

  if (!user) {
    const error = new Error('Invalid email or password')
    error.code = 'INVALID_CREDENTIALS'
    throw error
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatch) {
    const error = new Error('Invalid email or password')
    error.code = 'INVALID_CREDENTIALS'
    throw error
  }
  
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )

  return {
    token: token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  }
}

module.exports = { register, login }