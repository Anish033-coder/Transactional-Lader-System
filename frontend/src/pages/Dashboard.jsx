import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BalanceCard from '../components/BalanceCard'
import TransferModal from '../components/TransferModal'
import TransactionTable from '../components/TransactionTable'
import { getAccounts, getTransactions, runReconciliation } from '../lib/api'

function Dashboard() {

  const [account, setAccount]                   = useState(null)
  const [transactions, setTransactions]         = useState([])
  const [reconciliation, setReconciliation]     = useState(null)
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState('')

  const [showModal, setShowModal]               = useState(false)
  const [modalMode, setModalMode]               = useState('transfer')
  const [reconLoading, setReconLoading]         = useState(false)

  useEffect(function() {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
     const [accountsResponse, transactionsResponse] = await Promise.all([
        getAccounts(),
        getTransactions(1, 5)   // page 1, only 5 transactions for the dashboard
      ])

    setAccount(accountsResponse.data.accounts[0] || null)

    setTransactions(transactionsResponse.data.transactions)

    } catch (err) {
      setError('Failed to load your account data. Please refresh the page')
    } finally {
      setLoading(false)
    }
  }

  async function handleReconciliation() {
    setReconLoading(true)

    try {
      const response = await runReconciliation()
      setReconciliation(response.data)
    } catch (err) {
      setError('Health check failed. Please try again')
    } finally {
      setReconLoading(false)
    }
  }

  const myAccountIds = account ? [account.id] : []

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

     <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (

          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-3">⏳</p>
            <p className="text-sm">Loading your account...</p>
          </div>

        ) : (

          <>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

              <BalanceCard
                account={account}
                onTransferClick={function() {
                  setModalMode('transfer')  
                  setShowModal(true)      
                }}
                onDepositClick={function() {
                  setModalMode('deposit')    
                  setShowModal(true)      
                }}
              />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">

                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Your Account ID
                  </h2>

                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    Share this ID with anyone who wants to send you money.
                    They paste it into the Send Money form.
                  </p>

                  {account && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-xs text-gray-500 break-all select-all">
                      {account.id}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">

                  <button
                    onClick={handleReconciliation}
                    disabled={reconLoading}
                    className="w-full text-sm text-gray-600 border border-gray-200 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {reconLoading ? 'Checking...' : '🔍 Check System Health'}
                  </button>

                  {account && (
                    <Link
                      to={'/history?accountId=' + account.id}
                      className="block w-full text-center text-sm text-blue-600 border border-blue-200 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      📒 View Ledger History
                    </Link>
                  )}

                  {reconciliation && (
                    <div className={
                      'p-3 rounded-xl text-sm ' +
                      (reconciliation.healthy
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200')
                    }>
                      {reconciliation.healthy
                        ? '✅ System healthy — all balances verified'
                        : '❌ Issues found — ' + reconciliation.summary.balance_mismatch_count + ' balance mismatches'
                      }
                    </div>
                  )}

                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recent Transactions
                </h2>
                <Link
                  to="/transactions"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  View all →
                </Link>
              </div>

              <TransactionTable
                transactions={transactions}
                myAccountIds={myAccountIds}
                showPagination={false}
              />

            </div>

          </>
        )}
      </div>

      {showModal && account && (
        <TransferModal
          mode={modalMode}
          accountId={account.id}
          onClose={function() { setShowModal(false) }}
          onSuccess={loadData}   
        />
      )}

    </div>
  )
}

export default Dashboard