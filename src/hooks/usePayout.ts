import { useState } from 'react'

interface PayoutResult {
  txHash: string
  explorerUrl: string
  winnerAddress: string
  amount: number
}

interface PayoutState {
  status: 'idle' | 'sending' | 'confirmed' | 'error'
  result: PayoutResult | null
  error: string | null
}

export function usePayout() {
  const [state, setState] = useState<PayoutState>({
    status: 'idle',
    result: null,
    error: null,
  })

  async function sendPayout(winnerAddress: string, potAmount: number) {
    setState({ status: 'sending', result: null, error: null })

    try {
      const res = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerAddress, potAmount }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Payout failed')
      }

      setState({
        status: 'confirmed',
        result: {
          txHash: data.txHash,
          explorerUrl: data.explorerUrl,
          winnerAddress: data.winnerAddress,
          amount: data.amount,
        },
        error: null,
      })

      return data
    } catch (err: any) {
      setState({
        status: 'error',
        result: null,
        error: err?.message ?? 'Payout failed',
      })
      throw err
    }
  }

  function reset() {
    setState({ status: 'idle', result: null, error: null })
  }

  return { ...state, sendPayout, reset }
}