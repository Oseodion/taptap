import { Link, useLocation } from 'react-router-dom'

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

export default function Navbar({ isDark, toggleTheme, isMuted, toggleMute, authenticated, xHandle, xAvatar, login, logout }: Props) {
  const location = useLocation()

  const btnStyle = {
    width: '36px', height: '36px',
    borderRadius: '50%',
    border: isDark ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.9)',
    background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
    transition: 'all 0.2s',
    flexShrink: 0,
    boxShadow: isDark
      ? 'inset 0 1.5px 0 rgba(167,139,250,0.4)'
      : 'inset 0 1.5px 0 rgba(255,255,255,1), 0 2px 8px rgba(124,58,237,0.08)',
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '64px',
      background: isDark ? 'rgba(13, 7, 32, 0.55)' : 'rgba(255, 255, 255, 0.45)',
      backdropFilter: 'blur(32px) saturate(200%)',
      WebkitBackdropFilter: 'blur(32px) saturate(200%)',
      borderBottom: isDark ? '1px solid rgba(167, 139, 250, 0.1)' : '1px solid rgba(255, 255, 255, 0.8)',
      boxShadow: isDark ? 'inset 0 -1px 0 rgba(167,139,250,0.05)' : 'inset 0 -1px 0 rgba(255,255,255,0.5)',
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', lineHeight: 1 }}>
            <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '20px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1.5px' }}>tap</span>
            <span style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px' }}>tap</span>
          </div>
          <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
            <div style={{ width: '18px', height: '3px', borderRadius: '2px', background: 'var(--gold)' }} />
            <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: isDark ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.2)' }} />
          </div>
        </div>
      </Link>

      {/* Nav links — centered */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Link to="/how-it-works" className="nav-link" style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
          color: location.pathname === '/how-it-works' ? 'var(--primary)' : 'var(--text2)',
          textDecoration: 'none', display: 'none',
        }}>
          How it works
        </Link>
        <Link to="/leaderboard" className="nav-link" style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: 500,
          color: location.pathname === '/leaderboard' ? 'var(--primary)' : 'var(--text2)',
          textDecoration: 'none', display: 'none',
        }}>
          Leaderboard
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Mute toggle */}
        <button onClick={toggleMute} style={{ ...btnStyle, opacity: isMuted ? 0.5 : 1 }} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} style={btnStyle}>
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Auth — profile pic + handle when signed in, Sign in button when not */}
        {authenticated && xHandle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '5px 12px 5px 6px',
              background: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
              border: isDark ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(124,58,237,0.2)',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', gap: '7px',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              boxShadow: isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.3)' : 'inset 0 1.5px 0 rgba(255,255,255,0.9)',
            }}>
              {/* Profile picture or X icon fallback */}
              {xAvatar ? (
                <img
                  src={xAvatar}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  alt={xHandle}
                />
              ) : (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              )}
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                {xHandle}
              </span>
            </div>

            {/* Sign out button */}
            <button
              onClick={logout}
              style={{
                ...btnStyle,
                width: 'auto',
                padding: '0 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                color: 'var(--text2)',
              }}
            >
              Out
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            style={{
              padding: '8px 18px',
              background: isDark ? 'rgba(124,58,237,0.15)' : 'var(--primary)',
              color: isDark ? '#C4B5FD' : 'white',
              border: isDark ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              boxShadow: isDark ? 'inset 0 1.5px 0 rgba(167,139,250,0.5)' : '0 4px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Sign in
          </button>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .nav-link { display: block !important; }
        }
      `}</style>
    </nav>
  )
}