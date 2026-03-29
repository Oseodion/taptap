import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Navbar from '../components/Navbar'
import BlobBackground from '../components/BlobBackground'
import { useNavigate } from 'react-router-dom'

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

// Step 1 illustration — room card with pot and players joining 
function IllustrationJoin({ isDark, animate }: { isDark: boolean; animate: boolean }) {
  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '320px' }}>
      {/* Card background */}
      <motion.rect
        x="20" y="20" width="280" height="200" rx="20"
        fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        stroke={isDark ? 'rgba(167,139,250,0.2)' : 'rgba(124,58,237,0.15)'}
        strokeWidth="1"
        initial={{ opacity: 0, y: 20 }}
        animate={animate ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      />

      {/* Room label */}
      <motion.text
        x="160" y="55" textAnchor="middle"
        fill={isDark ? 'rgba(167,139,250,0.6)' : 'rgba(124,58,237,0.5)'}
        fontSize="10" fontFamily="DM Sans, sans-serif" letterSpacing="1"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      >
        QUICK MATCH
      </motion.text>

      {/* Pot amount */}
      <motion.text
        x="160" y="100" textAnchor="middle"
        fill="#F59E0B"
        fontSize="36" fontFamily="Orbitron, monospace" fontWeight="700"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        style={{ transformOrigin: '160px 100px' }}
      >
        50
      </motion.text>
      <motion.text
        x="160" y="118" textAnchor="middle"
        fill="#F59E0B"
        fontSize="13" fontFamily="Orbitron, monospace" fontWeight="700"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ delay: 0.4 }}
      >
        STRK
      </motion.text>

      {/* Player avatars */}
      {[
        { cx: 120, delay: 0.5, label: 'You', color: isDark ? '#7C3AED' : '#7C3AED' },
        { cx: 160, delay: 0.65, label: 'Bot', color: isDark ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.2)' },
        { cx: 200, delay: 0.8, label: '?', color: isDark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.1)' },
      ].map((p, i) => (
        <motion.g key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={animate ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: p.delay, type: 'spring', stiffness: 260 }}
        >
          <circle cx={p.cx} cy="158" r="18" fill={p.color}
            stroke={isDark ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.8)'} strokeWidth="2" />
          <text x={p.cx} y="163" textAnchor="middle"
            fill={i === 0 ? 'white' : isDark ? 'rgba(167,139,250,0.8)' : 'rgba(124,58,237,0.8)'}
            fontSize="10" fontFamily="DM Sans, sans-serif" fontWeight="700">
            {p.label}
          </text>
        </motion.g>
      ))}

      {/* Pulsing live dot */}
      <motion.circle cx="252" cy="38" r="5" fill="#EF4444"
        animate={animate ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
        style={{ transformOrigin: '252px 38px' }}
      />

      {/* Countdown pill */}
      <motion.rect x="100" y="188" width="120" height="22" rx="11"
        fill={isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)'}
        stroke={isDark ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.2)'} strokeWidth="1"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      />
      <motion.text x="160" y="203" textAnchor="middle"
        fill={isDark ? 'rgba(167,139,250,0.9)' : 'var(--primary)'}
        fontSize="9" fontFamily="DM Sans, sans-serif" fontWeight="600"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        Game starts in 8s
      </motion.text>
    </svg>
  )
}

// ── Step 2 illustration — big countdown timer ticking down ────────────────────
function IllustrationCountdown({ isDark, animate }: { isDark: boolean; animate: boolean }) {
  const [count, setCount] = useState(10)

  useEffect(() => {
    if (!animate) return
    const t = setInterval(() => setCount(c => c <= 1 ? 10 : c - 1), 900)
    return () => clearInterval(t)
  }, [animate])

  const color = count > 7 ? (isDark ? '#A78BFA' : '#7C3AED') : count > 3 ? '#F59E0B' : '#EF4444'
  const glow = count > 7 ? 'rgba(124,58,237,0.4)' : count > 3 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.5)'

  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '320px' }}>
      {/* Glow behind number */}
      <motion.ellipse cx="160" cy="115" rx="70" ry="60"
        fill={glow} opacity="0.25"
        animate={{ rx: [65, 75, 65], opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 0.9 }}
      />

      {/* Big number */}
      <motion.text
        key={count}
        x="160" y="148" textAnchor="middle"
        fill={color}
        fontSize="110" fontFamily="Orbitron, monospace" fontWeight="900"
        initial={{ scale: 1.2, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
        style={{ transformOrigin: '160px 115px' }}
      >
        {count}
      </motion.text>

      {/* GET READY label — shows at 3 */}
      {count <= 3 && (
        <motion.text
          x="160" y="32" textAnchor="middle"
          fill="#EF4444"
          fontSize="11" fontFamily="Unbounded, sans-serif" fontWeight="700" letterSpacing="2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [1, 0.4, 1], y: 0 }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          GET READY
        </motion.text>
      )}

      {/* Tension bar */}
      <rect x="40" y="210" width="240" height="4" rx="2"
        fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
      <motion.rect x="40" y="210" height="4" rx="2"
        fill={color}
        animate={{ width: `${((10 - count) / 10) * 240}` }}
        transition={{ duration: 0.8, ease: 'linear' }}
      />

      {/* Pot pill */}
      <rect x="100" y="224" width="120" height="14" rx="7"
        fill={isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)'}
        stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
      <text x="160" y="234" textAnchor="middle"
        fill="#F59E0B" fontSize="8" fontFamily="Orbitron, monospace" fontWeight="700">
        50 STRK IN POT
      </text>
    </svg>
  )
}

//  Step 3 illustration — TAP button pulsing 
function IllustrationTap({ isDark, animate }: { isDark: boolean; animate: boolean }) {
  const [tapped, setTapped] = useState(false)

  useEffect(() => {
    if (!animate) return
    // Auto-demo tap cycle
    const t = setTimeout(() => {
      setTapped(true)
      setTimeout(() => setTapped(false), 1200)
    }, 1800)
    const cycle = setInterval(() => {
      setTapped(true)
      setTimeout(() => setTapped(false), 1200)
    }, 3000)
    return () => { clearTimeout(t); clearInterval(cycle) }
  }, [animate])

  return (
    <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '320px' }}>
      {/* NOW label */}
      <motion.text
        x="160" y="28" textAnchor="middle"
        fill="#EF4444"
        fontSize="11" fontFamily="Orbitron, monospace" fontWeight="700" letterSpacing="2"
        animate={animate ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        NOW
      </motion.text>

      {/* Outer pulse rings */}
      {!tapped && animate && [1, 2].map(i => (
        <motion.circle key={i} cx="160" cy="125" r="75"
          stroke={isDark ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.25)'}
          strokeWidth="1.5" fill="none"
          animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.5 }}
          style={{ transformOrigin: '160px 125px' }}
        />
      ))}

      {/* Main button circle */}
      <motion.circle cx="160" cy="125" r="62"
        fill={tapped
          ? (isDark ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.35)')
          : (isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)')}
        stroke={isDark ? 'rgba(167,139,250,0.8)' : '#7C3AED'}
        strokeWidth="2.5"
        animate={tapped
          ? { scale: 0.88 }
          : animate ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={tapped
          ? { duration: 0.1 }
          : { repeat: Infinity, duration: 1 }}
        style={{ transformOrigin: '160px 125px' }}
      />

      {/* TAP text */}
      <motion.text
        x="160" y="120" textAnchor="middle"
        fill={isDark ? '#A78BFA' : '#7C3AED'}
        fontSize="28" fontFamily="Unbounded, sans-serif" fontWeight="900" letterSpacing="-1"
        animate={tapped ? { scale: 0.88 } : {}}
        style={{ transformOrigin: '160px 115px' }}
      >
        TAP
      </motion.text>
      <text x="160" y="138" textAnchor="middle"
        fill={isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)'}
        fontSize="10" fontFamily="DM Sans, sans-serif">
        now
      </text>

      {/* Win flash */}
      {tapped && (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{ transformOrigin: '160px 125px' }}>
          <circle cx="160" cy="125" r="62" fill="rgba(245,158,11,0.15)"
            stroke="rgba(245,158,11,0.5)" strokeWidth="2" />
          <text x="160" y="120" textAnchor="middle"
            fill="#F59E0B" fontSize="20" fontFamily="Unbounded, sans-serif" fontWeight="900">
            +50
          </text>
          <text x="160" y="138" textAnchor="middle"
            fill="#F59E0B" fontSize="12" fontFamily="Orbitron, monospace" fontWeight="700">
            STRK
          </text>
        </motion.g>
      )}

      {/* 0s left label */}
      <text x="160" y="212" textAnchor="middle"
        fill={isDark ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)'}
        fontSize="10" fontFamily="Orbitron, monospace">
        0s left
      </text>
    </svg>
  )
}

// Main page 

const STEPS = [
  {
    number: '01',
    title: 'Join a room',
    description: 'Pick any open room. Each room has a pot of STRK waiting to be won. The demo room needs no sign-in, just jump straight in.',
  },
  {
    number: '02',
    title: 'Watch the countdown',
    description: 'A timer counts down from 10 to zero. The color shifts from purple to gold to red as the pressure builds. Get your finger ready.',
  },
  {
    number: '03',
    title: 'Click first. Win everything.',
    description: 'The instant the timer hits zero, tap the button. First click wins the entire pot. Payout lands in your wallet instantly via Starkzap.',
  },
]

function Step({
  step, index, isDark, isLast,
}: {
  step: typeof STEPS[0]
  index: number
  isDark: boolean
  isLast: boolean
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const isEven = index % 2 === 0

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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Connector line */}
      {!isLast && (
        <motion.div
          initial={{ height: 0 }}
          animate={inView ? { height: '80px' } : {}}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '-80px',
            width: '2px',
            background: `linear-gradient(180deg, ${isDark ? 'rgba(167,139,250,0.4)' : 'rgba(124,58,237,0.3)'}, transparent)`,
            transform: 'translateX(-50%)',
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
          alignItems: 'center',
          marginBottom: '80px',
        }}
        className="step-grid"
      >
        {/* Text side */}
        <div style={{ order: isEven ? 0 : 1 }} className="step-text">
          {/* Step number */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px',
              fontWeight: 700,
              color: isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)',
              letterSpacing: '2px',
              marginBottom: '16px',
            }}
          >
            STEP {step.number}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Unbounded, sans-serif',
              fontSize: 'clamp(22px, 4vw, 32px)',
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              marginBottom: '16px',
            }}
          >
            {step.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            {step.description}
          </motion.p>
        </div>

        {/* Illustration side */}
        <motion.div
          initial={{ opacity: 0, x: isEven ? 20 : -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            order: isEven ? 1 : 0,
            ...glass,
            borderRadius: '24px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '240px',
          }}
          className="step-illustration"
        >
          {index === 0 && <IllustrationJoin isDark={isDark} animate={inView} />}
          {index === 1 && <IllustrationCountdown isDark={isDark} animate={inView} />}
          {index === 2 && <IllustrationTap isDark={isDark} animate={inView} />}
        </motion.div>
      </motion.div>
    </div>
  )
}
export default function Home({ isDark, toggleTheme, isMuted, toggleMute, authenticated, xHandle, xAvatar, login, logout }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflowX: 'hidden' }}>
      <BlobBackground />
      <Navbar isDark={isDark} toggleTheme={toggleTheme} isMuted={isMuted} toggleMute={toggleMute} authenticated={authenticated} xHandle={xHandle} xAvatar={xAvatar} login={login} logout={logout} />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '80px' }}
        >
          <h1 style={{
            fontFamily: 'Unbounded, sans-serif',
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 900,
            color: 'var(--text)',
            letterSpacing: '-2px',
            lineHeight: 1.05,
            marginBottom: '16px',
          }}>
            How it works
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '16px',
            color: 'var(--text2)',
            maxWidth: '420px',
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            Three steps. One winner. Instant payout. No gas fees.
          </p>
        </motion.div>

        {/* Steps */}
        {STEPS.map((step, i) => (
          <Step key={i} step={step} index={i} isDark={isDark} isLast={i === STEPS.length - 1} />
        ))}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', paddingTop: '20px' }}
        >
          <h3 style={{
            fontFamily: 'Unbounded, sans-serif',
            fontSize: 'clamp(18px, 4vw, 28px)',
            fontWeight: 900,
            color: 'var(--text)',
            letterSpacing: '-1px',
            marginBottom: '12px',
          }}>
            Ready to play?
          </h3>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: 'var(--text2)',
            marginBottom: '28px',
          }}>
            Try the demo room - no sign-in needed
          </p>
          <button
            onClick={() => navigate('/room/demo')}
            style={{
              padding: '15px 40px',
              background: 'var(--primary)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.45)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.35)'
            }}
          >
            Play now
          </button>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .step-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .step-text { order: 0 !important; }
          .step-illustration { order: 1 !important; }
        }
      `}</style>
    </div>
  )
}