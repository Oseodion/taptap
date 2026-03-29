import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import BlobBackground from '../components/BlobBackground'
import { useLeaderboard } from '../hooks/useLeaderboard'

interface Props {
  isDark: boolean
  toggleTheme: () => void
  isMuted: boolean
  toggleMute: () => void
  authenticated: boolean
  xHandle: string | null
  xAvatar: string | null
  login: () => void
  logout: () => void
}

type Tab = 'today' | 'week' | 'alltime'

// Fallback mock data shown before any real games are played
const MOCK_DATA: Record<Tab, { rank: number; handle: string; wins: number; earned: number }[]> = {
  today: [
    { rank: 1, handle: '@starkience', wins: 4, earned: 20 },
    { rank: 2, handle: '@adiiHQ', wins: 3, earned: 15 },
    { rank: 3, handle: '@cryptofast', wins: 2, earned: 10 },
    { rank: 4, handle: '@stark_dev', wins: 2, earned: 10 },
    { rank: 5, handle: '@clickmaster', wins: 1, earned: 5 },
    { rank: 6, handle: '@zeroxlayer', wins: 1, earned: 5 },
    { rank: 7, handle: '@tapqueen', wins: 1, earned: 5 },
    { rank: 8, handle: '@devjeff', wins: 1, earned: 5 },
  ],
  week: [
    { rank: 1, handle: '@starkience', wins: 12, earned: 180 },
    { rank: 2, handle: '@adiiHQ', wins: 9, earned: 125 },
    { rank: 3, handle: '@cryptofast', wins: 7, earned: 95 },
    { rank: 4, handle: '@clickmaster', wins: 5, earned: 75 },
    { rank: 5, handle: '@tapqueen', wins: 4, earned: 60 },
    { rank: 6, handle: '@stark_dev', wins: 3, earned: 50 },
    { rank: 7, handle: '@zeroxlayer', wins: 3, earned: 45 },
    { rank: 8, handle: '@devjeff', wins: 2, earned: 30 },
  ],
  alltime: [
    { rank: 1, handle: '@starkience', wins: 12, earned: 180 },
    { rank: 2, handle: '@adiiHQ', wins: 9, earned: 125 },
    { rank: 3, handle: '@cryptofast', wins: 7, earned: 95 },
    { rank: 4, handle: '@clickmaster', wins: 5, earned: 75 },
    { rank: 5, handle: '@tapqueen', wins: 4, earned: 60 },
    { rank: 6, handle: '@stark_dev', wins: 3, earned: 50 },
    { rank: 7, handle: '@zeroxlayer', wins: 3, earned: 45 },
    { rank: 8, handle: '@devjeff', wins: 2, earned: 30 },
  ],
}

const rankColor = (rank: number) => {
  if (rank === 1) return { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' }
  if (rank === 2) return { bg: 'rgba(156,163,175,0.1)', color: '#9CA3AF', border: 'rgba(156,163,175,0.25)' }
  if (rank === 3) return { bg: 'rgba(180,103,52,0.1)', color: '#B46734', border: 'rgba(180,103,52,0.25)' }
  return { bg: 'transparent', color: 'var(--text2)', border: 'transparent' }
}

export default function Leaderboard({ isDark, toggleTheme, isMuted, toggleMute, authenticated, xHandle, xAvatar, login, logout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('alltime')
  const { players: liveePlayers } = useLeaderboard()
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

  // Use live data if available, fallback to mock
  const entries = liveePlayers.length > 0
    ? liveePlayers.map(p => ({
      rank: p.rank,
      handle: p.x_handle,
      wins: p.wins,
      earned: p.total_earned,
    }))
    : MOCK_DATA[activeTab]

  // Find current user in entries
  const userEntry = xHandle ? entries.find(e => e.handle === xHandle) : null
  const userRank = userEntry?.rank ?? null
  const userWins = userEntry?.wins ?? 0
  const userEarned = userEntry?.earned ?? 0

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This week' },
    { key: 'alltime', label: 'All time' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>
      <BlobBackground />
      <Navbar isDark={isDark} toggleTheme={toggleTheme} isMuted={isMuted} toggleMute={toggleMute} authenticated={authenticated} xHandle={xHandle} xAvatar={xAvatar} login={login} logout={logout} />

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '100px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', marginBottom: '8px' }}>Leaderboard</h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: 'var(--text2)' }}>Top players ranked by STRK won. Sign in with X to appear here.</p>
        </motion.div>

        {/* Your rank card — only shown when signed in */}
        {authenticated && xHandle && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            style={{ ...glass, borderRadius: '20px', padding: '20px 24px', marginBottom: '24px', border: isDark ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(124,58,237,0.25)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Real profile pic */}
                {xAvatar ? (
                  <img src={xAvatar} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={xHandle} />
                ) : (
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                )}
                <div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{xHandle}</div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'var(--text2)' }}>Your ranking</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {[
                  { label: 'Rank', value: userRank ? `#${userRank}` : '—', color: 'var(--primary)' },
                  { label: 'Wins', value: String(userWins), color: 'var(--text)' },
                  { label: 'STRK', value: String(userEarned), color: 'var(--gold)' },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {i > 0 && <div style={{ width: '1px', height: '32px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '20px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: 'var(--text2)', marginTop: '3px' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '8px 20px', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: activeTab === tab.key ? '1px solid rgba(124,58,237,0.4)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)', background: activeTab === tab.key ? isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.4)', color: activeTab === tab.key ? 'var(--primary)' : 'var(--text2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: activeTab === tab.key ? isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9)' : isDark ? 'inset 0 1.5px 0 rgba(255,255,255,0.05)' : 'inset 0 1.5px 0 rgba(255,255,255,0.8)' }}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} style={{ ...glass, borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 100px', padding: '12px 20px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(124,58,237,0.06)' }}>
            {['#', 'Player', 'Wins', 'Earned'].map((h, i) => (
              <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: i > 1 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {entries.map((entry, i) => {
                const rc = rankColor(entry.rank)
                const isCurrentUser = entry.handle === xHandle
                return (
                  <motion.div key={entry.handle} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 100px', padding: '14px 20px', alignItems: 'center', borderBottom: i < entries.length - 1 ? isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(124,58,237,0.05)' : 'none', background: isCurrentUser ? isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)' : 'transparent' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>{entry.rank}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isCurrentUser ? 'var(--primary)' : isDark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {isCurrentUser && xAvatar ? (
                          <img src={xAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={xHandle ?? ''} />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={isCurrentUser ? 'white' : 'var(--primary)'}>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: isCurrentUser ? 700 : 500, color: isCurrentUser ? 'var(--primary)' : 'var(--text)' }}>{entry.handle}</div>
                        {isCurrentUser && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: 'var(--primary)', opacity: 0.7 }}>You</div>}
                      </div>
                    </div>

                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{entry.wins}</div>
                    <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--gold)', textAlign: 'right' }}>{entry.earned} <span style={{ fontSize: '10px', opacity: 0.7 }}>STRK</span></div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Sign in prompt — hidden when already authenticated */}
        {!authenticated && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ marginTop: '20px', padding: '16px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', background: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.04)', border: isDark ? '1px solid rgba(167,139,250,0.15)' : '1px solid rgba(124,58,237,0.12)' }}
          >
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'var(--text2)' }}>Sign in with X to track your wins and appear on the leaderboard</span>
            <button onClick={login} style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in
            </button>
          </motion.div>
        )}

      </div>
    </div>
  )
}