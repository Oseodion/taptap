import type { VercelRequest, VercelResponse } from '@vercel/node'
import { StarkZap, StarkSigner, Amount, fromAddress, getPresets, OnboardStrategy, accountPresets } from 'starkzap'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { winnerAddress, potAmount } = req.body

  if (!winnerAddress || !potAmount) {
    return res.status(400).json({ error: 'Missing winnerAddress or potAmount' })
  }

  // Validate winner address
  if (!winnerAddress.startsWith('0x') || winnerAddress.length < 10) {
    return res.status(400).json({ error: 'Invalid winner wallet address' })
  }

  const privateKey = process.env.HOUSE_WALLET_PRIVATE_KEY
  const houseAddress = process.env.HOUSE_WALLET_ADDRESS

  if (!privateKey || !houseAddress) {
    return res.status(500).json({ error: 'House wallet not configured' })
  }

  try {
    const sdk = new StarkZap({ network: 'sepolia' })

    const { wallet } = await sdk.onboard({
      strategy: OnboardStrategy.Signer,
      account: {
        signer: new StarkSigner(privateKey),
        accountClass: accountPresets.argentXV040,
      },
      deploy: 'if_needed',
    })

    const STRK = getPresets(wallet.getChainId()).STRK

    const tx = await wallet.transfer(STRK, [
      {
        to: fromAddress(winnerAddress),
        amount: Amount.parse(String(potAmount), STRK),
      },
    ])

    await tx.wait()

    return res.status(200).json({
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://sepolia.starkscan.co/tx/${tx.hash}`,
      winnerAddress,
      amount: potAmount,
    })
  } catch (error: any) {
    console.error('Payout error:', error)
    return res.status(500).json({
      error: error?.message ?? 'Payout failed',
    })
  }
}