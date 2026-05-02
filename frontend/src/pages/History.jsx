import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getAccountHistory } from '../lib/api'

function History() {

  const [searchParams] = useSearchParams()
  const accountId = searchParams.get('accountId')

  const [historyData, setHistoryData]   = useState(null)
  const [currentPage, setCurrentPage]   = useState(1)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(function() {

    if (!accountId) {
      setError('No account ID provided in the URL')
      setLoading(false)
      return
    }

    loadHistory(currentPage)

  }, [accountId, currentPage])

  async function loadHistory(page) {
    setLoading(true)
    setError('')

    try {
      const response = await getAccountHistory(accountId, page, 20)
      setHistoryData(response.data)
    } catch (err) {
      setError('Failed to load ledger history. Please try again')
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(parseFloat(amount))
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <Link
          to="/dashboard"
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          📒 Ledger History
        </h1>

        {historyData?.account && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm mb-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-blue-200 text-sm">
                  {historyData.account.name}
                </p>
                <p className="font-mono text-xs text-blue-300 mt-0.5">
                  {historyData.account.id}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatAmount(historyData.account.balance)}
                </p>
                <p className="text-blue-300 text-xs mt-0.5">Current Balance</p>
              </div>

            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <div className="mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Every Balance Change
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Each row is one ledger entry. Balance After shows the exact
              account balance at that moment in time. This is double-entry bookkeeping.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-3">⏳</p>
              <p className="text-sm">Loading ledger entries...</p>
            </div>

          ) : !historyData?.entries?.length ? (

            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No ledger entries yet</p>
            </div>

          ) : (

            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">

                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Balance After</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Note</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-50">

                    {historyData.entries.map(function(entry) {

                      const isCredit = entry.entry_type === 'CREDIT'

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">

                          <td className="py-3.5 px-3">
                            <span className={
                              'text-xs font-semibold px-2.5 py-1 rounded-full ' +
                              (isCredit
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700')
                            }>
                              {entry.entry_type}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {entry.transaction_type}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={
                              'font-semibold ' +
                              (isCredit ? 'text-green-600' : 'text-red-500')
                            }>
                              {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-gray-700">
                            {formatAmount(entry.balance_after)}
                          </td>

                          <td className="py-3.5 px-3 text-gray-400 text-xs">
                            {entry.note || <span className="text-gray-300">—</span>}
                          </td>

                          <td className="py-3.5 px-3 text-gray-400 text-xs whitespace-nowrap">
                            {formatDate(entry.created_at)}
                          </td>

                        </tr>
                      )
                    })}

                  </tbody>
                </table>
              </div>

              {historyData.pagination && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">

                  <p className="text-xs text-gray-400">
                    Page {historyData.pagination.page} of {historyData.pagination.totalPages || 1}
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={historyData.pagination.page <= 1}
                      onClick={function() { setCurrentPage(currentPage - 1) }}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      disabled={!historyData.pagination.hasNext}
                      onClick={function() { setCurrentPage(currentPage + 1) }}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>

                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default History