import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import TransactionTable from '../components/TransactionTable'
import { getAccounts, getTransactions } from '../lib/api'

function Transactions() {

  const [account, setAccount]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination]     = useState(null)
  const [currentPage, setCurrentPage]   = useState(1)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(function() {
    loadAccount()
  }, [])

  useEffect(function() {
    loadTransactions(currentPage)
  }, [currentPage])

  async function loadAccount() {
    try {
      const response = await getAccounts()
      setAccount(response.data.accounts[0] || null)
    } catch (err) {
      setError('Failed to load account information')
    }
  }

  async function loadTransactions(page) {
    setLoading(true)
    setError('')

    try {
      const response = await getTransactions(page, 20)
      setTransactions(response.data.transactions)
      setPagination(response.data.pagination)
    } catch (err) {
      setError('Failed to load transactions. Please try again')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    setCurrentPage(newPage)
  }

  const myAccountIds = account ? [account.id] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Transaction History
        </h1>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-3">⏳</p>
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : (
            <TransactionTable
              transactions={transactions}
              myAccountIds={myAccountIds}
              showPagination={true}         
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default Transactions