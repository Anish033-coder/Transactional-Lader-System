import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {

   const { user, logout } = useAuth()
   const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
   <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">

      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">

        <Link
          to="/dashboard"
          className="text-blue-600 font-bold text-lg tracking-tight"
        >
          💳 LedgerApp
        </Link>

        <div className="flex items-center gap-4">

          <Link
            to="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
          >
            Dashboard
          </Link>

          <Link
            to="/transactions"
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
          >
            Transactions
          </Link>

          {user && (
            <span className="text-xs text-gray-400 hidden sm:block">
              {user.email}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  )
}

export default Navbar