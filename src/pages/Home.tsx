import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import BlobBackground from '../components/BlobBackground'
import { useAudio } from '../hooks/useAudio'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { supabase } from '../lib/supabase'

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

const ROOM_CONFIGS = [
    { id: 'demo', name: 'Demo', pot: 5, maxPlayers: 2, isDemo: true },
    { id: 'high-stakes', name: 'High Stakes', pot: 100, maxPlayers: 4, isDemo: false },
    { id: 'fast-lane', name: 'Fast Lane', pot: 25, maxPlayers: 2, isDemo: false },
]

export default function Home({ isDark, toggleTheme, isMuted, toggleMute, authenticated, xHandle, xAvatar, walletAddress, login, logout }: Props) {
    const navigate = useNavigate()
    const audio = useAudio(isMuted)
    const ambientStarted = useRef(false)
    const { stats, players: leaderboardPlayers } = useLeaderboard()
    const [introComplete, setIntroComplete] = useState(false)
    const [isFirstVisit, setIsFirstVisit] = useState(false)
    const [typedText, setTypedText] = useState('')
    const [roomSessions, setRoomSessions] = useState<Record<string, { player_count: number; status: string }>>({})

    const tagline = 'Join a room. Watch the timer. Click first. Win STRK.'

    const glass = isDark ? {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1.5px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)',
    } : {
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 8px 32px rgba(124,58,237,0.08), inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(124,58,237,0.05)',
    }

    const howItWorksBtn = isDark ? {
        background: 'rgba(124, 58, 237, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(167,139,250,0.5)',
        boxShadow: 'inset 0 1.5px 0 rgba(167,139,250,0.5), 0 0 20px rgba(124,58,237,0.1)',
        color: '#C4B5FD',
    } : {
        background: 'rgba(255,255,255,0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1), 0 2px 12px rgba(124,58,237,0.06)',
        color: 'var(--primary)',
    }

    // Fetch live room sessions from Supabase
    useEffect(() => {
        fetchRoomSessions()

        const channel = supabase
            .channel('room_sessions_home')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_sessions' }, () => {
                fetchRoomSessions()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchRoomSessions() {
        const { data } = await supabase.from('room_sessions').select('room_id, player_count, status')
        if (data) {
            const map: Record<string, { player_count: number; status: string }> = {}
            data.forEach(r => { map[r.room_id] = { player_count: r.player_count, status: r.status } })
            setRoomSessions(map)
        }
    }

    useEffect(() => {
        window.scrollTo({ top: 0 })
        const visited = localStorage.getItem('visited')
        if (!visited) {
            setIsFirstVisit(true)
            localStorage.setItem('visited', 'true')
            setTimeout(() => setIntroComplete(true), 2800)
        } else {
            setIntroComplete(true)
        }
    }, [])

    useEffect(() => {
        if (!introComplete) return
        const handleFirstInteraction = () => {
            if (ambientStarted.current) return
            ambientStarted.current = true
            audio.playAmbient()
            window.removeEventListener('click', handleFirstInteraction)
            window.removeEventListener('keydown', handleFirstInteraction)
        }
        window.addEventListener('click', handleFirstInteraction)
        window.addEventListener('keydown', handleFirstInteraction)
        return () => {
            window.removeEventListener('click', handleFirstInteraction)
            window.removeEventListener('keydown', handleFirstInteraction)
        }
    }, [introComplete])

    useEffect(() => {
        return () => audio.stopAmbient()
    }, [])

    useEffect(() => {
        if (!isFirstVisit) return
        let i = 0
        const start = setTimeout(() => {
            const interval = setInterval(() => {
                if (i <= tagline.length) {
                    setTypedText(tagline.slice(0, i))
                    i++
                } else clearInterval(interval)
            }, 34)
            return () => clearInterval(interval)
        }, 1600)
        return () => clearTimeout(start)
    }, [isFirstVisit])

    function handlePlayNow() {
        if (ambientStarted.current) {
            audio.fadeOutAmbient(800)
            setTimeout(() => navigate('/room/demo'), 820)
        } else {
            navigate('/room/demo')
        }
    }

    function handleRoomClick(room: typeof ROOM_CONFIGS[0]) {
        if (room.isDemo) {
            if (ambientStarted.current) {
                audio.fadeOutAmbient(800)
                setTimeout(() => navigate(`/room/${room.id}`), 820)
            } else {
                navigate(`/room/${room.id}`)
            }
        } else if (authenticated) {
            navigate(`/room/${room.id}`)
        }
    }

    const d = (n: number) => isFirstVisit ? 0 + n * 0.06 : n * 0.06

    // Format stats — use real data if available, fallback to defaults
    const statItems = [
        {
            label: 'Total paid out today',
            value: stats.totalPaidOut > 0 ? `${stats.totalPaidOut} STRK` : '125 STRK'
        },
        {
            label: 'Active players',
            value: stats.activePlayers > 0 ? String(stats.activePlayers) : '3'
        },
        {
            label: 'Biggest win ever',
            value: stats.biggestWin > 0 ? `${stats.biggestWin} STRK` : '180 STRK'
        },
    ]

    // Use real leaderboard if data exists, fallback to mock
    const displayLeaderboard = leaderboardPlayers.length > 0
        ? leaderboardPlayers.slice(0, 3).map(p => ({
            rank: p.rank,
            handle: p.x_handle,
            won: p.total_earned,
        }))
        : [
            { rank: 1, handle: '@starkience', won: 180 },
            { rank: 2, handle: '@adiiHQ', won: 125 },
            { rank: 3, handle: '@cryptofast', won: 95 },
        ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>
            <BlobBackground />

            <AnimatePresence>
                {isFirstVisit && !introComplete && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.8 } }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 200,
                            background: 'var(--bg)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '20px',
                        }}
                    >
                        <BlobBackground />
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', overflow: 'hidden' }}>
                                <motion.span
                                    initial={{ x: -120, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 160, damping: 14 }}
                                    style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(52px, 12vw, 84px)', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-4px', lineHeight: 1, display: 'block' }}
                                >tap</motion.span>
                                <motion.span
                                    initial={{ x: 120, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.45, duration: 0.6, type: 'spring', stiffness: 160, damping: 14 }}
                                    style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(52px, 12vw, 84px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-4px', lineHeight: 1, display: 'block' }}
                                >tap</motion.span>
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: 52 }} transition={{ delay: 0.95, duration: 0.45, type: 'spring', stiffness: 220, damping: 16 }} style={{ height: '5px', borderRadius: '3px', background: 'var(--gold)' }} />
                                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 28, opacity: 1 }} transition={{ delay: 1.2, duration: 0.35, ease: 'easeOut' }} style={{ height: '5px', borderRadius: '3px', background: isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.18)' }} />
                            </div>
                        </div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', color: 'var(--text2)', maxWidth: '360px', textAlign: 'center', minHeight: '22px', position: 'relative', zIndex: 1 }}>
                            {typedText}
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ color: 'var(--primary)' }}>|</motion.span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: introComplete ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ position: 'relative', zIndex: 1 }}>
                <Navbar isDark={isDark} toggleTheme={toggleTheme} isMuted={isMuted} toggleMute={toggleMute} authenticated={authenticated} xHandle={xHandle} xAvatar={xAvatar} login={login} logout={logout} />

                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>

                    {/* Hero */}
                    <div style={{ paddingTop: '130px', paddingBottom: '64px', textAlign: 'center' }}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 16 }} transition={{ delay: d(0), duration: 0.5 }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: isDark ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.8)', borderRadius: '20px', marginBottom: '32px', boxShadow: isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,1)' }}
                        >
                            <div style={{ width: '7px', height: '7px', background: '#EF4444', borderRadius: '50%', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: isDark ? '#C4B5FD' : 'var(--primary)', letterSpacing: '0.5px' }}>Live on Starknet Sepolia</span>
                        </motion.div>

                        <div style={{ overflow: 'hidden', marginBottom: '4px' }}>
                            <motion.h1 initial={{ opacity: 0, x: -60 }} animate={{ opacity: introComplete ? 1 : 0, x: introComplete ? 0 : -60 }} transition={{ delay: d(1), duration: 0.7, type: 'spring', stiffness: 120 }} style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05, color: 'var(--text)', letterSpacing: '-2px', margin: 0 }}>
                                First to click
                            </motion.h1>
                        </div>
                        <div style={{ overflow: 'hidden', marginBottom: '24px' }}>
                            <motion.h1 initial={{ opacity: 0, x: 60 }} animate={{ opacity: introComplete ? 1 : 0, x: introComplete ? 0 : 60 }} transition={{ delay: d(2), duration: 0.7, type: 'spring', stiffness: 120 }} style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05, color: 'var(--gold)', letterSpacing: '-2px', margin: 0 }}>
                                wins everything.
                            </motion.h1>
                        </div>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20 }} transition={{ delay: d(3), duration: 0.6 }} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 'clamp(14px, 2vw, 18px)', color: 'var(--text2)', maxWidth: '460px', margin: '0 auto 40px', lineHeight: 1.65 }}>
                            Join a room, watch the countdown, click the moment it hits zero. One pot. One winner. Instant STRK payout.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20 }} transition={{ delay: d(4), duration: 0.5 }} style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={handlePlayNow} style={{ padding: '15px 36px', background: isDark ? '#6D28D9' : 'var(--primary)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: isDark ? '0 4px 24px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 4px 24px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 32px rgba(109,40,217,0.6), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 8px 32px rgba(124,58,237,0.45)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 24px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : '0 4px 24px rgba(124,58,237,0.35)' }}
                            >Play now</button>
                            <button onClick={() => navigate('/how-it-works')} style={{ padding: '15px 36px', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', outline: 'none', ...howItWorksBtn }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >How it works</button>
                        </motion.div>
                    </div>

                    {/* Stats — live from Supabase */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 24 }} transition={{ delay: d(5), duration: 0.5 }} className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '48px' }}>
                        {statItems.map((stat, i) => (
                            <div key={i} style={{ ...glass, borderRadius: '16px', padding: '20px 24px' }}>
                                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '8px' }}>{stat.label}</div>
                                <div style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0', fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>{stat.value}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Live Rooms — live player counts from Supabase */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 24 }} transition={{ delay: d(6), duration: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Live Rooms</h2>
                        </div>

                        <div className="rooms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '48px' }}>
                            {ROOM_CONFIGS.map((room, i) => {
                                const session = roomSessions[room.id]
                                const playerCount = session?.player_count ?? 0
                                const status = session?.status ?? 'waiting'
                                const isClickable = room.isDemo || authenticated

                                return (
                                    <motion.div
                                        key={room.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 16 }}
                                        transition={{ delay: d(6) + i * 0.08 }}
                                        onClick={() => handleRoomClick(room)}
                                        style={{ ...glass, borderRadius: '20px', padding: '22px', cursor: isClickable ? 'pointer' : 'default', transition: 'transform 0.2s', position: 'relative' as const }}
                                        whileHover={isClickable ? { y: -4 } : {}}
                                    >
                                        {/* Lock overlay — only for non-demo when not authenticated */}
                                        {!room.isDemo && !authenticated && (
                                            <div style={{ position: 'absolute' as const, inset: 0, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, background: isDark ? 'rgba(13,7,32,0.4)' : 'rgba(245,240,255,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                                                <div style={{ background: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: isDark ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.9)', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,1)' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}>
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                    </svg>
                                                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>Sign in to play</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Demo badge */}
                                        {room.isDemo && (
                                            <div style={{ position: 'absolute' as const, top: '14px', right: '14px', background: isDark ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: isDark ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(5,150,105,0.2)', borderRadius: '8px', padding: '3px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: '10px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', boxShadow: isDark ? 'inset 0 1px 0 rgba(52,211,153,0.1)' : 'inset 0 1.5px 0 rgba(255,255,255,1)' }}>
                                                Demo
                                            </div>
                                        )}

                                        <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: room.isDemo ? '4px' : '16px', paddingRight: room.isDemo ? '56px' : 0 }}>{room.name}</div>

                                        {room.isDemo && (
                                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--primary)', marginBottom: '12px', opacity: 0.8 }}>Play with bot - no sign in needed</div>
                                        )}

                                        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '30px', fontWeight: 700, color: 'var(--gold)', marginBottom: '4px', letterSpacing: '0' }}>
                                            {room.pot}<span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '20px', marginLeft: '4px' }}>STRK</span>
                                        </div>
                                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)', marginBottom: '20px' }}>In the pot</div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)' }}>
                                                {playerCount}/{room.maxPlayers} players
                                            </span>
                                            <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: status === 'live' ? 'rgba(239,68,68,0.1)' : isDark ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.5)', color: status === 'live' ? 'var(--red)' : 'var(--primary)', border: status === 'live' ? '1px solid rgba(239,68,68,0.25)' : isDark ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.8)', boxShadow: isDark ? 'inset 0 1px 0 rgba(167,139,250,0.1)' : 'inset 0 1.5px 0 rgba(255,255,255,1)', animation: status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>
                                                {status === 'live' ? 'Live' : 'Waiting'}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Top Players — live from Supabase */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 24 }} transition={{ delay: d(7), duration: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Top Players</h2>
                            <button onClick={() => navigate('/leaderboard')} style={{ background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View all</button>
                        </div>

                        <div style={{ ...glass, borderRadius: '20px', overflow: 'hidden' }}>
                            {displayLeaderboard.map((entry, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: i < displayLeaderboard.length - 1 ? isDark ? '1px solid rgba(167,139,250,0.08)' : '1px solid rgba(124,58,237,0.06)' : 'none', gap: '16px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, background: i === 0 ? 'rgba(245,158,11,0.12)' : i === 1 ? 'rgba(156,163,175,0.1)' : 'rgba(180,103,52,0.1)', color: i === 0 ? 'var(--gold)' : i === 1 ? '#9CA3AF' : '#B46734' }}>
                                        {entry.rank}
                                    </div>
                                    <div style={{ flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{entry.handle}</div>
                                    <div style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0', fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>{entry.won} STRK</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </motion.div>

            <style>{`
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes livePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); border-color: rgba(239,68,68,0.25); } 50% { box-shadow: 0 0 0 5px rgba(239,68,68,0); border-color: rgba(239,68,68,0.6); } }
        @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr !important; } .rooms-grid { grid-template-columns: 1fr !important; } }
      `}</style>
        </div>
    )
}