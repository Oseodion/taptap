import type { VercelRequest, VercelResponse } from '@vercel/node'
import { StarkZap, StarkSigner, getPresets, OnboardStrategy } from 'starkzap'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { walletAddress } = req.body

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing walletAddress' })
  }

  const privateKey = process.env.HOUSE_WALLET_PRIVATE_KEY

  if (!privateKey) {
    return res.status(500).json({ error: 'House wallet not configured' })
  }

  try {
    const sdk = new StarkZap({ network: 'sepolia' })

    const { wallet } = await sdk.onboard({
      strategy: OnboardStrategy.Signer,
      account: { signer: new StarkSigner(privateKey) },
      deploy: 'if_needed',
    })

    const STRK = getPresets(wallet.getChainId()).STRK
    const balance = await wallet.balanceOf(STRK)

    return res.status(200).json({
      balance: balance.toFormatted(),
      raw: balance.toString(),
    })
  } catch (error: any) {
    console.error('Balance error:', error)
    return res.status(500).json({ error: error?.message ?? 'Failed to fetch balance' })
  }
}