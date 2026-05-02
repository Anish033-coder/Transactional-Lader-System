import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function Login() {

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const { login, isLoggedIn } = useAuth()

  const navigate = useNavigate()

  if (isLoggedIn) {
    navigate('/dashboard')
    return null   
  }

  async function handleSubmit(event) {

    event.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)

    try {
      const response = await loginUser(email, password)

     login(response.data.token)

      navigate('/dashboard')

    } catch (err) {

      if (err.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password. Please try again')
      } else {
        setError('Login failed. Please try again')
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <p className="text-4xl mb-2">💳</p>
          <h1 className="text-2xl font-bold text-gray-800">LedgerApp</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={function(e) { setEmail(e.target.value) }}
                disabled={loading}
                autoFocus   
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"  
                placeholder="Your password"
                value={password}
                onChange={function(e) { setPassword(e.target.value) }}
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login