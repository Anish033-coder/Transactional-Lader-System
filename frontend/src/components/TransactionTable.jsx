function TransactionTable({ transactions, myAccountIds, showPagination, pagination, onPageChange }) {

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  function isMoneyComingIn(transaction) {
    return myAccountIds.includes(transaction.to_account_id)
  }

  const typeBadgeClasses = {
    TRANSFER:   'bg-blue-100 text-blue-700',
    DEPOSIT:    'bg-green-100 text-green-700',
    WITHDRAWAL: 'bg-red-100 text-red-700',
  }

  const statusBadgeClasses = {
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING:   'bg-yellow-100 text-yellow-700',
    FAILED:    'bg-red-100 text-red-700',
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm">No transactions yet. Make a deposit to get started!</p>
      </div>
    )
  }

  return (
    <div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Note</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">

            {transactions.map(function(transaction) {

              const incoming = isMoneyComingIn(transaction)

              return (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">

                  <td className="py-3.5 px-3">
                    <span className={
                      'text-xs font-semibold px-2.5 py-1 rounded-full ' +
                      (typeBadgeClasses[transaction.type] || 'bg-gray-100 text-gray-600')
                    }>
                      {transaction.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={
                      'font-semibold ' +
                      (incoming ? 'text-green-600' : 'text-red-500')
                    }>
                      {incoming ? '+' : '-'}{formatAmount(transaction.amount)}
                    </span>
                  </td>

                   <td className="py-3.5 px-3 text-gray-500 max-w-xs truncate">
                    {transaction.note || <span className="text-gray-300">—</span>}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={
                      'text-xs font-semibold px-2.5 py-1 rounded-full ' +
                      (statusBadgeClasses[transaction.status] || 'bg-gray-100 text-gray-600')
                    }>
                      {transaction.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-gray-400 text-xs whitespace-nowrap">
                    {formatDate(transaction.created_at)}
                  </td>

                </tr>
              )
            })}

          </tbody>
        </table>
      </div>

      {showPagination && pagination && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">

          <p className="text-xs text-gray-400">
            Page {pagination.page} of {pagination.totalPages || 1}
            {' '}· {pagination.total} total
          </p>

          <div className="flex gap-2">

            <button
              disabled={pagination.page <= 1}
              onClick={function() { onPageChange(pagination.page - 1) }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <button
              disabled={!pagination.hasNext}
              onClick={function() { onPageChange(pagination.page + 1) }}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

export default TransactionTable