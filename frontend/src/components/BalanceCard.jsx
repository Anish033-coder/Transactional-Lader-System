function BalanceCard({ account, onTransferClick, onDepositClick }) {

  if (!account) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg animate-pulse">
        <p className="text-blue-200 text-sm">Loading balance...</p>
        <div className="h-10 bg-blue-500 rounded mt-3 w-40"></div>
      </div>
    )
  }

  const formattedBalance = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: account.currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parseFloat(account.balance))
  
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-1">

        <p className="text-blue-200 text-sm font-medium">
          {account.name}
        </p>

        <span className="text-xs bg-blue-500 bg-opacity-50 px-2 py-0.5 rounded-full">
          {account.status}
        </span>

      </div>

      <p className="text-3xl font-bold mt-2 mb-1">
        {formattedBalance}
      </p>

      <p className="text-blue-300 text-xs mb-6">Available Balance</p>
      <div className="flex gap-3">

        <button
          onClick={onTransferClick}
          className="flex-1 bg-white text-blue-700 text-sm font-semibold py-2 rounded-xl hover:bg-blue-50 transition-colors"
        >
          ↗ Send Money
        </button>

        <button
          onClick={onDepositClick}
          className="flex-1 bg-blue-500 bg-opacity-40 text-white text-sm font-semibold py-2 rounded-xl hover:bg-opacity-60 transition-colors border border-blue-400 border-opacity-40"
        >
          ↙ Deposit
        </button>

      </div>

      <p className="text-blue-300 text-xs mt-4 truncate">
        ID: {account.id}
      </p>

    </div>
  )
}

export default BalanceCard