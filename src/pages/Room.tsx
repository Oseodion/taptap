import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import BlobBackground from '../components/BlobBackground'
import { useAudio } from '../hooks/useAudio'
import { usePayout } from '../hooks/usePayout'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useRoom } from '../hooks/useRoom'

interface Props {
  isDark: boolean
  toggleTheme: () => void
  isMuted: boolean
  toggleMute: () => void
  authenticated: boolean
  xHandle: string | null
  xAvatar: string | null
  walletAddress: string | null
  login: () => void
  logout: () => void
}

type Phase =
  | 'waiting'
  | 'countdown'
  | 'clickable'
  | 'demo_claim'
  | 'enter_wallet'
  | 'paying'
  | 'winner'
  | 'loser'
  | 'expired'

const ROOM_CONFIG: Record<string, { name: string; pot: number; maxPlayers: number; isDemo: boolean }> = {
  'demo': { name: 'Demo', pot: 5, maxPlayers: 2, isDemo: true },
  'high-stakes': { name: 'High Stakes', pot: 100, maxPlayers: 4, isDemo: false },
  'fast-lane': { name: 'Fast Lane', pot: 25, maxPlayers: 2, isDemo: false },
}

const WAIT_DURATION = 8
const COUNTDOWN_DURATION = 10
const CLICK_WINDOW = 3
const CLAIM_WINDOW = 60

export default function Room({ isDark, toggleTheme, isMuted, toggleMute, authenticated, xHandle, xAvatar, login, logout }: Props) {
  const { id: roomId = 'demo' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const audio = useAudio(isMuted)
  const payout = usePayout()
  const { recordWin } = useLeaderboard()
  const { room, joinRoom, leaveRoom } = useRoom(roomId)

  const config = ROOM_CONFIG[roomId] ?? ROOM_CONFIG['demo']
  const POT = config.pot

  const [phase, setPhase] = useState<Phase>('waiting')
  const [waitSeconds, setWaitSeconds] = useState(WAIT_DURATION)
  const [countSeconds, setCountSeconds] = useState(COUNTDOWN_DURATION)
  const [clickSeconds, setClickSeconds] = useState(CLICK_WINDOW)
  const [claimSeconds, setClaimSeconds] = useState(CLAIM_WINDOW)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null)
  const [inputWallet, setInputWallet] = useState('')
  const [walletError, setWalletError] = useState('')

  const intervalRef = useRef<number | null>(null)
  const botTimerRef = useRef<number | null>(null)
  const botReactionMs = useRef<number>(0)
  const userClickedRef = useRef(false)
  const hasJoined = useRef(false)

  const glass = isDark ? {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1.5px 0 rgba(255,255,255,0.1)',
  } : {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 32px rgba(124,58,237,0.08), inset 0 1.5px 0 rgba(255,255,255,0.9)',
  }

  // Join room on mount
  useEffect(() => {
    if (!room || hasJoined.current) return
    hasJoined.current = true
    joinRoom()
    return () => { if (hasJoined.current) { hasJoined.current = false; leaveRoom() } }
  }, [room?.room_id])

  useEffect(() => {
    return () => { if (hasJoined.current) leaveRoom() }
  }, [])

  // ── Waiting phase ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'waiting') return
    if (!config.isDemo && room && room.player_count < config.maxPlayers) return

    intervalRef.current = window.setInterval(() => {
      setWaitSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          const rand = Math.random()
          if (rand < 0.1) {
            botReactionMs.current = 150 + Math.random() * 150
          } else {
            botReactionMs.current = 400 + Math.random() * 600
          }
          userClickedRef.current = false
          audio.playCountdown()
          setPhase('countdown')
          return WAIT_DURATION
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [phase, room])

  // ── Countdown phase ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    intervalRef.current = window.setInterval(() => {
      setCountSeconds(s => {
        audio.setCountdownIntensity(s, COUNTDOWN_DURATION)
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          audio.stopCountdown()
          setPhase('clickable')
          botTimerRef.current = window.setTimeout(() => {
            if (!userClickedRef.current) setPhase('loser')
          }, botReactionMs.current)
          return COUNTDOWN_DURATION
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [phase])

  // ── Clickable phase ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'clickable') return
    setClickSeconds(CLICK_WINDOW)
    intervalRef.current = window.setInterval(() => {
      setClickSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          if (!userClickedRef.current) setPhase('loser')
          return CLICK_WINDOW
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [phase])

  // ── Claim countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'demo_claim') return
    setClaimSeconds(CLAIM_WINDOW)
    intervalRef.current = window.setInterval(() => {
      setClaimSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          setPhase('expired')
          return CLAIM_WINDOW
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [phase])

  // Auto-trigger wallet entry when user signs in on claim screen
  useEffect(() => {
    if (phase === 'demo_claim' && authenticated) {
      clearInterval(intervalRef.current!)
      setPhase('enter_wallet')
    }
  }, [authenticated, phase])

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current!)
      clearTimeout(botTimerRef.current!)
      audio.stopAll()
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleClick() {
    if (phase !== 'clickable') return
    userClickedRef.current = true
    clearInterval(intervalRef.current!)
    clearTimeout(botTimerRef.current!)
    audio.playClick()
    setPhase('enter_wallet')
  }

  function handleWalletSubmit() {
    const addr = inputWallet.trim()
    if (!addr.startsWith('0x') || addr.length < 20) {
      setWalletError('Please enter a valid Starknet address starting with 0x')
      return
    }
    setWalletError('')
    handleClaim(addr)
  }

  async function handleClaim(winnerAddr: string) {
    setPhase('paying')
    try {
      const result = await payout.sendPayout(winnerAddr, POT)
      setTxHash(result.txHash)
      setExplorerUrl(result.explorerUrl)
      if (xHandle) {
        await recordWin(xHandle, xAvatar, winnerAddr, POT, roomId, result.txHash)
      }
      setPhase('winner')
    } catch {
      setPhase('winner')
    }
  }

  function reset() {
    clearInterval(intervalRef.current!)
    clearTimeout(botTimerRef.current!)
    audio.stopAll()
    userClickedRef.current = false
    setPhase('waiting')
    setWaitSeconds(WAIT_DURATION)
    setCountSeconds(COUNTDOWN_DURATION)
    setClickSeconds(CLICK_WINDOW)
    setClaimSeconds(CLAIM_WINDOW)
    setTxHash(null)
    setExplorerUrl(null)
    setInputWallet('')
    setWalletError('')
  }

  const timerColor = countSeconds > 7 ? 'var(--primary)' : countSeconds > 3 ? 'var(--gold)' : 'var(--red)'
  const timerGlow = countSeconds > 7 ? 'rgba(124,58,237,0.4)' : countSeconds > 3 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.5)'
  const playerCount = room?.player_count ?? 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>
      <BlobBackground />
      <Navbar isDark={isDark} toggleTheme={toggleTheme} isMuted={isMuted} toggleMute={toggleMute} authenticated={authenticated} xHandle={xHandle} xAvatar={xAvatar} login={login} logout={logout} />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', justifyContent: 'center', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── WAITING ─────────────────────────────────────────────────── */}
          {phase === 'waiting' && (
            <motion.div key="waiting" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '24px', paddingBottom: '24px' }}
            >
              <div style={{ ...glass, borderRadius: '24px', padding: '32px', width: '100%', textAlign: 'center' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '12px' }}>{config.name} Room</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 700, color: 'var(--gold)', lineHeight: 1, marginBottom: '8px' }}>{POT} STRK</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', marginBottom: '24px' }}>in the pot</div>

                {config.isDemo && (
                  <div style={{ background: isDark ? 'rgba(52,211,153,0.08)' : 'rgba(5,150,105,0.06)', border: isDark ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(5,150,105,0.15)', borderRadius: '12px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0, animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>Demo mode — you're playing against a bot</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {config.isDemo ? (
                    <>
                      {['You', 'Bot'].map((label, i) => (
                        <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: i === 0 ? 'var(--primary)' : isDark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.15)', border: isDark ? '2px solid rgba(167,139,250,0.3)' : '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 700, color: i === 0 ? 'white' : 'var(--primary)' }}>{label}</div>
                      ))}
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', marginLeft: '4px' }}>2/2 players</span>
                    </>
                  ) : (
                    <>
                      {Array.from({ length: config.maxPlayers }).map((_, i) => (
                        <div key={i} style={{ width: '36px', height: '36px', borderRadius: '50%', background: i < playerCount ? 'var(--primary)' : isDark ? 'rgba(167,139,250,0.1)' : 'rgba(124,58,237,0.08)', border: isDark ? '2px solid rgba(167,139,250,0.3)' : '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: 700, color: i < playerCount ? 'white' : 'var(--text2)' }}>
                          {i < playerCount ? (i === 0 ? 'You' : `P${i + 1}`) : '?'}
                        </div>
                      ))}
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', marginLeft: '4px' }}>{playerCount}/{config.maxPlayers} players</span>
                    </>
                  )}
                </div>

                {!config.isDemo && playerCount < config.maxPlayers ? (
                  <div style={{ ...glass, borderRadius: '14px', padding: '14px 24px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>Waiting for {config.maxPlayers - playerCount} more player{config.maxPlayers - playerCount > 1 ? 's' : ''}...</span>
                  </div>
                ) : (
                  <div style={{ ...glass, borderRadius: '14px', padding: '14px 24px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulseDot 1s ease-in-out infinite' }} />
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'var(--text)', fontWeight: 600 }}>Game starts in <span style={{ fontFamily: 'Orbitron, monospace', color: 'var(--primary)' }}>{waitSeconds}s</span></span>
                  </div>
                )}
              </div>

              <div style={{ ...glass, borderRadius: '20px', padding: '20px 24px', width: '100%' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px', letterSpacing: '0.5px' }}>How to win</div>
                {['Watch the countdown timer', 'Click the button the instant it hits zero', 'First click wins the entire pot', 'STRK paid out instantly via Starkzap'].map((rule, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 3 ? '10px' : 0 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700, color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>{rule}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', cursor: 'pointer', textDecoration: 'underline' }}>Leave room</button>
            </motion.div>
          )}

          {/* ── COUNTDOWN ───────────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <motion.div key="countdown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.35 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
            >
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Get ready</div>
              <motion.div key={countSeconds} initial={{ scale: 1.15, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.25, type: 'spring', stiffness: 200 }}
                style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(80px, 20vw, 140px)', fontWeight: 900, color: timerColor, lineHeight: 1, textShadow: `0 0 60px ${timerGlow}`, transition: 'color 0.3s ease, text-shadow 0.3s ease' }}
              >{countSeconds}</motion.div>
              <div style={{ ...glass, borderRadius: '16px', padding: '16px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>Prize pot</div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>{POT} STRK</div>
              </div>
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: '2px', background: timerColor, width: `${(countSeconds / COUNTDOWN_DURATION) * 100}%`, transition: 'width 0.9s linear, background 0.3s ease' }} />
              </div>
              {countSeconds <= 3 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--red)', letterSpacing: '1px', animation: 'pulseDot 0.6s ease-in-out infinite' }}>GET READY</motion.div>
              )}
            </motion.div>
          )}

          {/* ── CLICKABLE ───────────────────────────────────────────────── */}
          {phase === 'clickable' && (
            <motion.div key="clickable" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, type: 'spring', stiffness: 200 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}
            >
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', color: 'var(--red)', letterSpacing: '1px', animation: 'livePulse 0.8s ease-in-out infinite' }}>NOW</div>
              <motion.button onClick={handleClick} whileTap={{ scale: 0.92 }}
                style={{ width: '200px', height: '200px', borderRadius: '50%', background: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '3px solid var(--primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 0 0 0 rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.3), inset 0 1.5px 0 rgba(255,255,255,0.2)', animation: 'tapPulse 1s ease-in-out infinite', position: 'relative', overflow: 'hidden' }}
              >
                <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '28px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px', lineHeight: 1 }}>TAP</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px' }}>now</span>
              </motion.button>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', color: 'var(--text2)' }}>{clickSeconds}s left</div>
            </motion.div>
          )}

          {/* ── DEMO CLAIM — not signed in ────────────────────────────────── */}
          {phase === 'demo_claim' && (
            <motion.div key="demo_claim" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring', stiffness: 160 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <Confetti />
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>You beat the bot!</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'var(--text2)' }}>Sign in with X to claim your {POT} STRK</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} style={{ ...glass, borderRadius: '20px', padding: '28px 32px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>{POT} STRK</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', marginBottom: '24px' }}>Waiting to be claimed</div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Claim expires in</div>
                  <motion.div key={claimSeconds} initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}
                    style={{ fontFamily: 'Orbitron, monospace', fontSize: '40px', fontWeight: 700, color: claimSeconds <= 10 ? 'var(--red)' : 'var(--primary)', lineHeight: 1 }}
                  >{claimSeconds}s</motion.div>
                  <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: '12px' }}>
                    <motion.div style={{ height: '100%', borderRadius: '2px', background: claimSeconds <= 10 ? 'var(--red)' : 'var(--primary)', width: `${(claimSeconds / CLAIM_WINDOW) * 100}%`, transition: 'width 0.9s linear, background 0.3s ease' }} />
                  </div>
                </div>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={login}
                  style={{ width: '100%', padding: '15px 24px', background: '#000000', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Sign in with X to claim
                </motion.button>
              </motion.div>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} onClick={reset}
                style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', cursor: 'pointer', textDecoration: 'underline' }}
              >Skip and play again</motion.button>
            </motion.div>
          )}

          {/* ── ENTER WALLET ─────────────────────────────────────────────── */}
          {phase === 'enter_wallet' && (
            <motion.div key="enter_wallet" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring', stiffness: 160 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <Confetti />

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>You won!</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'var(--text2)' }}>Enter your Starknet wallet to receive {POT} STRK</div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ ...glass, borderRadius: '20px', padding: '28px 32px', width: '100%' }}
              >
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, color: 'var(--gold)', textAlign: 'center', marginBottom: '24px' }}>{POT} STRK</div>

                <div style={{ marginBottom: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  Your Starknet wallet address
                </div>
                <input
                  type="text"
                  value={inputWallet}
                  onChange={e => { setInputWallet(e.target.value); setWalletError('') }}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: walletError ? '1px solid var(--red)' : isDark ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(124,58,237,0.2)',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    color: 'var(--text)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '8px',
                  }}
                />
                {walletError && (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--red)', marginBottom: '12px' }}>{walletError}</div>
                )}

                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--text2)', marginBottom: '20px' }}>
                  Use your Argent X or Braavos wallet address on Starknet Sepolia
                </div>

                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleWalletSubmit}
                  style={{ width: '100%', padding: '15px 24px', background: 'var(--primary)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
                >
                  Claim {POT} STRK
                </motion.button>
              </motion.div>

              <button onClick={reset} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', cursor: 'pointer', textDecoration: 'underline' }}>
                Skip and play again
              </button>
            </motion.div>
          )}

          {/* ── PAYING ───────────────────────────────────────────────────── */}
          {phase === 'paying' && (
            <motion.div key="paying" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>Sending...</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'var(--text2)' }}>Processing your payout via Starkzap</div>
              </div>
              <div style={{ ...glass, borderRadius: '20px', padding: '28px 32px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '48px', fontWeight: 700, color: 'var(--gold)', marginBottom: '16px' }}>{POT} STRK</div>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}
                />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)', marginTop: '16px' }}>Sending to your wallet on Starknet Sepolia...</div>
              </div>
            </motion.div>
          )}

          {/* ── WINNER ───────────────────────────────────────────────────── */}
          {phase === 'winner' && (
            <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring', stiffness: 160 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <Confetti />
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(36px, 8vw, 60px)', fontWeight: 900, color: 'var(--gold)', letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>You won.</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'var(--text2)' }}>First click. Clean sweep.</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                style={{ ...glass, borderRadius: '20px', padding: '24px 32px', textAlign: 'center', width: '100%' }}
              >
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px' }}>+{POT} STRK</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>Paid to your wallet via Starkzap</div>
                {txHash ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: isDark ? 'rgba(167,139,250,0.6)' : 'rgba(124,58,237,0.5)', letterSpacing: '0.3px', wordBreak: 'break-all' }}>tx: {txHash}</div>
                    {explorerUrl && (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                      >
                        View on Starkscan
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)' }}>tx: processing...</div>
                )}
              </motion.div>
              <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} onClick={reset} whileHover={{ y: -2 }}
                style={{ padding: '14px 40px', background: 'var(--primary)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}
              >Play again</motion.button>
            </motion.div>
          )}

          {/* ── EXPIRED ──────────────────────────────────────────────────── */}
          {phase === 'expired' && (
            <motion.div key="expired" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: '8px' }}>Payout expired.</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'var(--text2)' }}>{POT} STRK returned to house wallet.</div>
              </div>
              <div style={{ ...glass, borderRadius: '20px', padding: '24px 32px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6 }}>Next time, sign in with X before playing so you can claim faster.</div>
              </div>
              <motion.button onClick={reset} whileHover={{ y: -2 }} style={{ padding: '14px 40px', background: 'var(--primary)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}>Play again</motion.button>
            </motion.div>
          )}

          {/* ── LOSER ───────────────────────────────────────────────────── */}
          {phase === 'loser' && (
            <motion.div key="loser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(36px, 8vw, 60px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1, marginBottom: '8px' }}>Too slow.</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: 'var(--text2)' }}>{config.isDemo ? 'The bot was faster.' : 'Someone else clicked first.'}</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                style={{ ...glass, borderRadius: '20px', padding: '24px 32px', textAlign: 'center', width: '100%' }}
              >
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '32px', fontWeight: 700, color: 'var(--text2)', marginBottom: '4px', textDecoration: 'line-through', opacity: 0.5 }}>{POT} STRK</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)' }}>Gone. Play again?</div>
              </motion.div>
              <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} onClick={reset} whileHover={{ y: -2 }}
                style={{ padding: '14px 40px', background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)', color: 'var(--primary)', border: isDark ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(124,58,237,0.25)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.4)' : 'inset 0 1.5px 0 rgba(255,255,255,1)' }}
              >Try again</motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.75); } }
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes tapPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.3), inset 0 1.5px 0 rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 0 20px rgba(124,58,237,0), 0 0 80px rgba(124,58,237,0.5), inset 0 1.5px 0 rgba(255,255,255,0.2); } }
      `}</style>
    </div>
  )
}

function Confetti() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: i % 4 === 0 ? '#FBBF24' : i % 4 === 1 ? '#A78BFA' : i % 4 === 2 ? '#34D399' : '#F87171',
    size: 4 + Math.random() * 6,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id} initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }} animate={{ y: '110vh', opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }} transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, width: `${p.size}px`, height: `${p.size}px`, borderRadius: Math.random() > 0.5 ? '50%' : '2px', background: p.color }}
        />
      ))}
    </div>
  )
}