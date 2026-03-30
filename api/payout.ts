import type { VercelRequest, VercelResponse } from '@vercel/node'
import { StarkZap, StarkSigner, OnboardStrategy, accountPresets, sepoliaTokens } from 'starkzap'
import { Account, RpcProvider, Signer, constants } from 'starknet'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { winnerAddress, potAmount } = req.body

  if (!winnerAddress || !potAmount) {
    return res.status(400).json({ error: 'Missing winnerAddress or potAmount' })
  }

  if (!winnerAddress.startsWith('0x') || winnerAddress.length < 10) {
    return res.status(400).json({ error: 'Invalid winner wallet address' })
  }

  const privateKey = process.env.HOUSE_WALLET_PRIVATE_KEY
  const houseAddress = process.env.HOUSE_WALLET_ADDRESS

  if (!privateKey || !houseAddress) {
    return res.status(500).json({ error: 'House wallet not configured' })
  }

  try {
    // Use Starkzap to onboard and verify wallet setup
    const sdk = new StarkZap({ network: 'sepolia' })
    const { wallet } = await sdk.onboard({
      strategy: OnboardStrategy.Signer,
      account: {
        signer: new StarkSigner(privateKey),
        accountClass: accountPresets.argentXV050,
      },
      deploy: 'never',
      feeMode: 'user_pays',
    })

    // Verify correct address
    if (wallet.address.toLowerCase() !== houseAddress.toLowerCase()) {
      throw new Error(`Address mismatch: ${wallet.address} !== ${houseAddress}`)
    }

    // Use starknet.js directly with explicit gas bounds
    // Starkzap's gas estimation sets l1_gas to 0x0 which causes "Out of gas" in validate
    const provider = new RpcProvider({
      nodeUrl: constants.NetworkName.SN_SEPOLIA,
    })

    const signer = new Signer(privateKey)
    const account = new Account({ provider, address: houseAddress, signer })

    // STRK token contract on Sepolia
    const STRK_ADDRESS = sepoliaTokens.STRK.address

    // Convert amount to uint256 (18 decimals)
    const amountBig = BigInt(Math.floor(Number(potAmount) * 1e18))
    const low = amountBig & BigInt('0xffffffffffffffffffffffffffffffff')
    const high = amountBig >> BigInt(128)

    const result = await account.execute(
      [
        {
          contractAddress: STRK_ADDRESS,
          entrypoint: 'transfer',
          calldata: [
            winnerAddress,
            low.toString(),
            high.toString(),
          ],
        },
      ],
      {
        resourceBounds: {
          l1_gas: {
            max_amount: BigInt('0x100'),
            max_price_per_unit: BigInt('0x100000000000000'),
          },
          l2_gas: {
            max_amount: BigInt('0x1000000'),
            max_price_per_unit: BigInt('0x5000000000'),
          },
          l1_data_gas: {
            max_amount: BigInt('0x500'),
            max_price_per_unit: BigInt('0x5000000'),
          },
        },
        tip: 0n,
        version: '0x3' as const,
      }
    )

    const txHash = result.transaction_hash

    return res.status(200).json({
      success: true,
      txHash,
      explorerUrl: `https://sepolia.voyager.online/tx/${txHash}`,
      winnerAddress,
      amount: potAmount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Payout error:', message)
    return res.status(500).json({ error: message || 'Payout failed' })
  }
}