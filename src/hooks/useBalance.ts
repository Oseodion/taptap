import { useState, useEffect } from 'react'

export function useBalance(walletAddress: string | null, authenticated: boolean) {
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authenticated || !walletAddress) {
      setBalance(null)
      return
    }
    fetchBalance()
  }, [authenticated, walletAddress])

  async function fetchBalance() {
    setLoading(true)
    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })
      const data = await res.json()
      if (data.balance) {
        // Format to 2 decimal places e.g. "12.50 STRK"
        const num = parseFloat(data.raw)
        setBalance(isNaN(num) ? data.balance : `${num.toFixed(2)} STRK`)
      }
    } catch {
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  // Refresh balance manually after a payout
  function refreshBalance() {
    if (authenticated && walletAddress) fetchBalance()
  }

  return { balance, loading, refreshBalance }
}