import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import Home from './pages/Home'
import Room from './pages/Room'
import Leaderboard from './pages/Leaderboard'
import HowItWorks from './pages/HowItWorks'
import ambientSrc from './assets/sounds/ambient_home.mp3'

export default function App() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )
  const [isMuted, setIsMuted] = useState(false)
  const { authenticated, user, login, logout } = usePrivy()
  const location = useLocation()

  // ── Persistent ambient audio — never unmounts ─────────────────────────
  const ambientRef = useRef<HTMLAudioElement | null>(null)
  const ambientStarted = useRef(false)
  const fadeIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    // Create audio once — never recreate
    const audio = new Audio(ambientSrc)
    audio.loop = true
    audio.volume = 0.18
    ambientRef.current = audio

    // Start on first user interaction anywhere in the app
    const handleFirstInteraction = () => {
      if (ambientStarted.current) return
      ambientStarted.current = true
      if (!isMuted) {
        audio.play().catch(() => {})
      }
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)

    return () => {
      audio.pause()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  // Mute/unmute ambient
  useEffect(() => {
    if (!ambientRef.current) return
    if (isMuted) {
      ambientRef.current.pause()
    } else if (ambientStarted.current) {
      ambientRef.current.play().catch(() => {})
    }
  }, [isMuted])

  // Fade out ambient when entering a room, fade back in when leaving
  useEffect(() => {
    if (!ambientRef.current || !ambientStarted.current) return
    const inRoom = location.pathname.startsWith('/room/')

    if (inRoom) {
      // Fade out ambient smoothly
      fadeAmbient(ambientRef.current, 0.18, 0, 800)
    } else {
      // Fade back in when returning to other pages
      if (!isMuted) {
        ambientRef.current.play().catch(() => {})
        fadeAmbient(ambientRef.current, ambientRef.current.volume, 0.18, 800)
      }
    }
  }, [location.pathname])

  function fadeAmbient(audio: HTMLAudioElement, from: number, to: number, durationMs: number) {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
    const steps = 30
    const interval = durationMs / steps
    const diff = to - from
    let step = 0
    audio.volume = from

    fadeIntervalRef.current = window.setInterval(() => {
      step++
      const next = Math.max(0, Math.min(1, from + (diff / steps) * step))
      audio.volume = next
      if (step >= steps) {
        clearInterval(fadeIntervalRef.current!)
        audio.volume = to
        if (to === 0) audio.pause()
      }
    }, interval)
  }

  const xHandle = user?.twitter?.username
    ? `@${user.twitter.username}`
    : null

  const xAvatar = user?.twitter?.profilePictureUrl ?? null
  // Get Starknet wallet address from Privy linked accounts
const walletAddress = (user?.linkedAccounts as any[])?.find(
  (a: any) => a.type === 'wallet' && a.chainType === 'starknet'
)?.address ?? null

  function toggleTheme() {
    const root = document.documentElement
    if (root.classList.contains('dark')) {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  function toggleMute() {
    setIsMuted(prev => !prev)
  }

  const authProps = {
    isDark,
    toggleTheme,
    isMuted,
    toggleMute,
    authenticated,
    xHandle,
    xAvatar,
    walletAddress,
    login,
    logout,
  }

  return (
    <Routes>
      <Route path="/" element={<Home {...authProps} />} />
      <Route path="/room/:id" element={<Room {...authProps} />} />
      <Route path="/leaderboard" element={<Leaderboard {...authProps} />} />
      <Route path="/how-it-works" element={<HowItWorks {...authProps} />} />
    </Routes>
  )
}