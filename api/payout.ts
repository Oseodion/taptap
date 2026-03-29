import type { VercelRequest, VercelResponse } from '@vercel/node'
import { StarkZap, StarkSigner, Amount, fromAddress, getPresets, OnboardStrategy, accountPresets } from 'starkzap'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { winnerAddress, potAmount } = req.body

  if (!winnerAddress || !potAmount) {
    return res.status(400).json({ error: 'Missing winnerAddress or potAmount' })
  }

  const privateKey = process.env.HOUSE_WALLET_PRIVATE_KEY
  const houseAddress = process.env.HOUSE_WALLET_ADDRESS

  if (!privateKey || !houseAddress) {
    return res.status(500).json({ error: 'House wallet not configured' })
  }

  try {
    // Initialize Starkzap with house wallet on Sepolia
    const sdk = new StarkZap({ network: 'sepolia' })

    const { wallet } = await sdk.onboard({
      strategy: OnboardStrategy.Signer,
      account: {
        signer: new StarkSigner(privateKey),
        accountClass: accountPresets.argentXV050,
      },
      deploy: 'if_needed',
    })

    // Get STRK token preset for Sepolia
    const STRK = getPresets(wallet.getChainId()).STRK

    // Validate winner address — must be a real hex address
    if (!winnerAddress || !winnerAddress.startsWith('0x') || winnerAddress.length < 10) {
      return res.status(400).json({ error: 'Invalid winner wallet address' })
    }
    // Send STRK from house wallet to winner
    const tx = await wallet.transfer(STRK, [
      {
        to: fromAddress(winnerAddress),
        amount: Amount.parse(String(potAmount), STRK),
      },
    ])

    // Wait for confirmation on L2
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