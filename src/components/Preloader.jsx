import { useState, useEffect } from 'react'

const BOOT_LINES = [
  { text: 'Bootstrapping data stack...', delay: 0 },
  { text: 'Loading pipeline configs...', delay: 320 },
  { text: 'Mounting BigQuery nodes...', delay: 640 },
  { text: 'Rendering portfolio...', delay: 960 },
  { text: 'System ready.', delay: 1380, accent: true },
]

// Minimum ms to show preloader — lets animation play fully even on fast connections
const MIN_MS = 2000

export default function Preloader({ onDone }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [unmounted, setUnmounted] = useState(false)

  useEffect(() => {
    // Reveal boot lines one by one
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, i])
        // Progress advances slightly ahead of lines for feel
        setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 85) + (i === BOOT_LINES.length - 1 ? 15 : 0))
      }, line.delay)
    )

    // Wait for window load + minimum display time
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      // Fill progress to 100 smoothly
      setProgress(100)
      setTimeout(() => {
        setExiting(true)
        setTimeout(() => {
          setUnmounted(true)
          onDone?.()
        }, 650)
      }, MIN_MS)
    }

    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
    }
    // Hard fallback — never hang longer than 5s
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
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'opacity 0.65s ease, transform 0.65s ease',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Animated data-flow lines */}
      {[15, 35, 60, 80].map((left) => (
        <div
          key={left}
          className="data-line opacity-20"
          style={{ left: `${left}%`, animationDelay: `${left * 0.03}s` }}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-7 px-6">

        {/* Alyx bot logo */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.25) 0%, rgba(168,85,247,0.15) 60%, transparent 100%)',
              transform: 'scale(1.8)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
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

        {/* Name + label */}
        <div className="text-center space-y-1">
          <p className="text-[10px] font-mono tracking-[0.5em] text-accent-cyan/50 uppercase">Portfolio</p>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Alief{' '}
            <span
              className="bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.4))' }}
            >
              Akbar
            </span>
          </h1>
          <p className="text-[10px] font-mono text-gray-600 tracking-widest">DATA ENGINEER &amp; BI ANALYST</p>
        </div>

        {/* Terminal boot lines */}
        <div className="w-72 sm:w-80 bg-surface-card/40 border border-surface-border rounded-xl overflow-hidden">
          {/* Terminal header */}
          <div className="terminal-header">
            <span className="terminal-dot bg-red-500" />
            <span className="terminal-dot bg-yellow-500" />
            <span className="terminal-dot bg-green-500" />
            <span className="ml-2 text-[10px] font-mono text-gray-500">alyx — boot sequence</span>
          </div>
          {/* Terminal body */}
          <div className="px-4 py-3 space-y-1.5 min-h-[100px]">
            {BOOT_LINES.map((line, i) => (
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
                  {line.accent && (
                    <span className="text-accent-green text-[10px]">✓</span>
                  )}
                </div>
              )
            ))}
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
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 8px rgba(0,212,255,0.5)',
              }}
            />
          </div>
        </div>

      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="text-[10px] font-mono text-gray-700 tracking-widest">
          ALYX // v2.0
        </span>
      </div>
    </div>
  )
}
