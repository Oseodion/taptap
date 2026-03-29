import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Player {
  rank: number
  x_handle: string
  x_avatar: string | null
  wins: number
  total_earned: number
}

interface Stats {
  totalPaidOut: number
  activePlayers: number
  biggestWin: number
}

export function useLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPaidOut: 125,
    activePlayers: 3,
    biggestWin: 100,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
    fetchStats()

    // Realtime updates when new games are played
    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'games' },
        () => {
          fetchLeaderboard()
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('x_handle, x_avatar, wins, total_earned')
      .order('total_earned', { ascending: false })
      .limit(10)

    if (data && data.length > 0) {
      setPlayers(
        data.map((p, i) => ({
          rank: i + 1,
          x_handle: p.x_handle,
          x_avatar: p.x_avatar,
          wins: p.wins,
          total_earned: p.total_earned,
        }))
      )
    }
    setLoading(false)
  }

  async function fetchStats() {
    // Total paid out
    const { data: gamesData } = await supabase
      .from('games')
      .select('pot_amount')

    if (gamesData && gamesData.length > 0) {
      const total = gamesData.reduce((sum, g) => sum + Number(g.pot_amount), 0)
      const biggest = Math.max(...gamesData.map(g => Number(g.pot_amount)))

      // Active players today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('games')
        .select('winner_handle', { count: 'exact', head: true })
        .gte('played_at', today.toISOString())

      setStats({
        totalPaidOut: total,
        activePlayers: count ?? 0,
        biggestWin: biggest,
      })
    }
  }

  async function recordWin(
    xHandle: string,
    xAvatar: string | null,
    walletAddress: string,
    potAmount: number,
    roomId: string,
    txHash: string
  ) {
    // Upsert player record
    await supabase.from('players').upsert(
      {
        x_handle: xHandle,
        x_avatar: xAvatar,
        wallet_address: walletAddress,
        wins: 1,
        total_earned: potAmount,
      },
      {
        onConflict: 'x_handle',
        ignoreDuplicates: false,
      }
    )

    // Increment wins and earnings for existing player
    await supabase.rpc('increment_player_stats', {
      p_handle: xHandle,
      p_amount: potAmount,
    })

    // Record the game
    await supabase.from('games').insert({
      room_id: roomId,
      winner_handle: xHandle,
      winner_wallet: walletAddress,
      pot_amount: potAmount,
      tx_hash: txHash,
    })

    // Refresh
    fetchLeaderboard()
    fetchStats()
  }

  return { players, stats, loading, recordWin }
}