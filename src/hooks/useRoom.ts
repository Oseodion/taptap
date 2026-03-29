import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface RoomSession {
  room_id: string
  player_count: number
  max_players: number
  status: 'waiting' | 'live' | 'finished'
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<RoomSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch initial room state
  useEffect(() => {
    fetchRoom()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_sessions',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as RoomSession)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  async function fetchRoom() {
    setLoading(true)
    const { data } = await supabase
      .from('room_sessions')
      .select('*')
      .eq('room_id', roomId)
      .single()
    if (data) setRoom(data)
    setLoading(false)
  }

  async function joinRoom() {
    if (!room) return
    await supabase
      .from('room_sessions')
      .update({
        player_count: room.player_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId)
  }

  async function leaveRoom() {
  await supabase
    .from('room_sessions')
    .update({
      player_count: Math.max(0, (room?.player_count ?? 1) - 1),
      updated_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
}

  async function setRoomStatus(status: 'waiting' | 'live' | 'finished') {
    await supabase
      .from('room_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
  }

  return { room, loading, joinRoom, leaveRoom, setRoomStatus }
}