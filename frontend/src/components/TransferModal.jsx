import { useState } from 'react'
import { transferMoney, depositMoney } from '../lib/api'

function TransferModal({ mode, accountId, onClose, onSuccess }) {

  const [toAccountId, setToAccountId] = useState('') 
  const [amount, setAmount]           = useState('')   
  const [note, setNote]               = useState('')  

 
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {

    event.preventDefault()

    setError('')
    setSuccess('')

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than zero')
      return   
    }

    if (mode === 'transfer' && !toAccountId.trim()) {
      setError('Please enter the recipient account ID')
      return
    }

    setLoading(true)

    try {

      if (mode === 'transfer') {
        await transferMoney(accountId, toAccountId.trim(), amount, note || undefined)
        setSuccess('Transfer successful! ✓')

      } else {
        await depositMoney(accountId, amount, note || undefined)
        setSuccess('Deposit successful! ✓')
      }

      setTimeout(function() {
        onSuccess() 
        onClose()  
      }, 1000)

    } catch (err) {

      if (err.code === 'INSUFFICIENT_FUNDS') {
        setError('You do not have enough balance for this transfer')
      } else if (err.code === 'DEST_NOT_FOUND') {
        setError('Recipient account not found. Please check the account ID')
      } else if (err.code === 'SAME_ACCOUNT') {
        setError('You cannot transfer to your own account')
      } else if (err.code === 'ACCOUNT_NOT_FOUND') {
        setError('Account not found')
      } else {

        setError(err.message || 'Something went wrong. Please try again')
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
      onClick={onClose}  
    >

      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={function(e) { e.stopPropagation() }}
      >

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-bold text-gray-800">
            {mode === 'transfer' ? '↗ Send Money' : '↙ Deposit Money'}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ✕
          </button>

        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Account ID
              </label>
              <input
                type="text"
                placeholder="Paste the recipient's account UUID"
                value={toAccountId}
                onChange={function(e) { setToAccountId(e.target.value) }}
                disabled={loading}   // disable while loading
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
               />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                ₹
              </span>
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={function(e) { setAmount(e.target.value) }}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="What is this for?"
              maxLength={200}  
              value={note}
              onChange={function(e) { setNote(e.target.value) }}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div className="flex gap-3 pt-1">

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : (mode === 'transfer' ? 'Send Money' : 'Deposit')}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

          </div>

        </form>
      </div>
    </div>
  )
}

export default TransferModal