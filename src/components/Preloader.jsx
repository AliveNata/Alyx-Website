import { useState, useEffect, useRef } from 'react'

const BOOT_LINES = [
  { text: 'Bootstrapping data stack...', delay: 0 },
  { text: 'Loading pipeline configs...', delay: 320 },
  { text: 'Mounting BigQuery nodes...',  delay: 640 },
  { text: 'Rendering portfolio...',      delay: 960 },
  { text: 'System ready.',              delay: 1380, accent: true },
]

const MIN_MS = 2000

const TECH_BADGES = [
  { label: 'Python',   color: '#3b82f6' },
  { label: 'SQL',      color: '#00d4ff' },
  { label: 'BigQuery', color: '#a855f7' },
  { label: 'dbt',      color: '#00ff88' },
  { label: 'Airflow',  color: '#f59e0b' },
  { label: 'Kafka',    color: '#ef4444' },
]

const ORBIT_R    = 90  // px from center
const ORBIT_MS   = 10000 // one full rotation

// ── Canvas particle network ─────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = (canvas.width  = window.innerWidth)
    let H = (canvas.height = window.innerHeight)

    const particles = Array.from({ length: 65 }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r:  Math.random() * 1.4 + 0.4,
    }))

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,212,255,0.22)'
        ctx.fill()
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0,212,255,${0.11 * (1 - d / 130)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

// ── JS-driven orbit (labels stay upright) ───────────────────────────────────
function OrbitingBadges() {
  const refs = useRef([])

  useEffect(() => {
    let raf
    const tick = (t) => {
      refs.current.forEach((el, i) => {
        if (!el) return
        const phase = ((t / ORBIT_MS + i / TECH_BADGES.length) % 1) * Math.PI * 2
        const x = ORBIT_R * Math.cos(phase)
        const y = ORBIT_R * Math.sin(phase)
        // combine centering offset + circular orbit in one transform (no rotation → labels upright)
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {TECH_BADGES.map((badge, i) => (
        <div
          key={badge.label}
          ref={el => { refs.current[i] = el }}
          className="absolute pointer-events-none"
          style={{ top: '50%', left: '50%', willChange: 'transform' }}
        >
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border whitespace-nowrap select-none"
            style={{
              color:           badge.color,
              borderColor:     badge.color + '55',
              backgroundColor: badge.color + '18',
              boxShadow:       `0 0 6px ${badge.color}30`,
            }}
          >
            {badge.label}
          </span>
        </div>
      ))}
    </>
  )
}

// ── Main Preloader ──────────────────────────────────────────────────────────
export default function Preloader({ onDone }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [progress,     setProgress]     = useState(0)
  const [exiting,      setExiting]      = useState(false)
  const [unmounted,    setUnmounted]    = useState(false)
  const [tilt,         setTilt]         = useState({ x: 0, y: 0 })

  // Mouse parallax tilt on center card
  useEffect(() => {
    const onMove = (e) => {
      setTilt({
        x:  (e.clientX / window.innerWidth  - 0.5) * 14,
        y: -(e.clientY / window.innerHeight - 0.5) * 14,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Boot sequence + finish logic
  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, i])
        setProgress(i === BOOT_LINES.length - 1 ? 100 : Math.round(((i + 1) / BOOT_LINES.length) * 82))
      }, line.delay)
    )

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      setProgress(100)
      setTimeout(() => {
        setExiting(true)
        setTimeout(() => { setUnmounted(true); onDone?.() }, 700)
      }, MIN_MS)
    }

    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    const fallback = setTimeout(finish, 5000)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(fallback)
      window.removeEventListener('load', finish)
    }
  }, [])

  if (unmounted) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#0a0f1c',
        opacity:    exiting ? 0 : 1,
        transform:  exiting ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Particle network */}
      <ParticleCanvas />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      {/* Sweeping scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.45) 50%, transparent 100%)',
          animation: 'preloaderScan 4s linear infinite',
        }}
      />

      {/* Center card — 3D parallax tilt */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6"
        style={{
          transform: `perspective(1100px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: 'transform 0.12s ease-out',
        }}
      >
        {/* Logo + orbit + pulse rings */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 210, height: 210 }}
        >
          {/* Pulse rings */}
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-accent-cyan/25 pointer-events-none"
              style={{
                width:  82 + i * 32,
                height: 82 + i * 32,
                animation: `preloaderPulse 2.8s ease-out ${i * 0.7}s infinite`,
              }}
            />
          ))}

          {/* Orbiting tech badges (JS-driven, labels always upright) */}
          <OrbitingBadges />

          {/* Logo */}
          <div className="relative z-10 w-20 h-20">
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)',
                transform: 'scale(2.4)',
                filter: 'blur(16px)',
              }}
            />
            <svg viewBox="0 0 48 48" className="relative w-full h-full" fill="none">
              <line x1="24" y1="10" x2="24" y2="5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="4" r="2" fill="#a855f7" />
              <rect x="10" y="10" width="28" height="24" rx="6" fill="#0a0f1c" stroke="#a855f7" strokeWidth="1.8" />
              <circle cx="18" cy="21" r="2.5" fill="#00d4ff" />
              <circle cx="30" cy="21" r="2.5" fill="#00d4ff" />
              <rect x="18" y="27" width="1.5" height="3" rx="0.5" fill="#00ff88" />
              <rect x="20.5" y="26" width="1.5" height="4" rx="0.5" fill="#00ff88" />
              <rect x="23" y="25" width="1.5" height="5" rx="0.5" fill="#00ff88" />
              <rect x="25.5" y="26" width="1.5" height="4" rx="0.5" fill="#00ff88" />
              <rect x="28" y="27" width="1.5" height="3" rx="0.5" fill="#00ff88" />
              <rect x="8" y="18" width="2" height="6" rx="1" fill="#a855f7" />
              <rect x="38" y="18" width="2" height="6" rx="1" fill="#a855f7" />
            </svg>
          </div>
        </div>

        {/* Name + subtitle */}
        <div className="text-center space-y-1" style={{ marginTop: -16 }}>
          <p className="text-[10px] font-mono tracking-[0.5em] text-accent-cyan/50 uppercase">Portfolio</p>
          <h1
            className="text-2xl font-black tracking-tight text-white"
            style={{ animation: 'preloaderGlitch 9s infinite' }}
          >
            Alief{' '}
            <span
              className="bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 22px rgba(0,212,255,0.45))' }}
            >
              Akbar
            </span>
          </h1>
          <p className="text-[10px] font-mono text-gray-600 tracking-widest">DATA ENGINEER &amp; BI ANALYST</p>
        </div>

        {/* Terminal boot sequence */}
        <div className="w-72 sm:w-80 bg-surface-card/40 border border-surface-border rounded-xl overflow-hidden">
          <div className="terminal-header">
            <span className="terminal-dot bg-red-500" />
            <span className="terminal-dot bg-yellow-500" />
            <span className="terminal-dot bg-green-500" />
            <span className="ml-2 text-[10px] font-mono text-gray-500">alyx — boot sequence</span>
          </div>
          <div className="px-4 py-3 space-y-1.5 min-h-[108px]">
            {BOOT_LINES.map((line, i) =>
              visibleLines.includes(i) && (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono"
                  style={{ animation: 'fadeSlideIn 0.25s ease forwards' }}
                >
                  <span className="text-accent-green shrink-0">$</span>
                  <span className={line.accent ? 'text-accent-cyan font-semibold' : 'text-gray-400'}>
                    {line.text}
                  </span>
                  {i === visibleLines[visibleLines.length - 1] && !line.accent && (
                    <span
                      className="w-[2px] h-3 bg-accent-cyan shrink-0"
                      style={{ animation: 'blink-caret 1s step-end infinite' }}
                    />
                  )}
                  {line.accent && <span className="text-accent-green text-[10px]">✓</span>}
                </div>
              )
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-72 sm:w-80">
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-600 mb-2">
            <span>Initializing...</span>
            <span className="text-accent-cyan tabular-nums">{progress}%</span>
          </div>
          <div className="h-[3px] bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
                transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 8px rgba(0,212,255,0.6)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                  animation: 'preloaderShimmer 1.4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="text-[10px] font-mono text-gray-700 tracking-widest">ALYX // v2.0</span>
      </div>
    </div>
  )
}
