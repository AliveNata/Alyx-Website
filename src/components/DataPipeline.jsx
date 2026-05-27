import { useState, useEffect, useRef } from 'react'
import { pipelineSteps } from '../data/portfolio'

const COLOR_MAP = {
  cyan: {
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/30',
    text: 'text-accent-cyan',
    icon: 'text-accent-cyan',
    badge: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    dot: 'bg-accent-cyan',
  },
  purple: {
    bg: 'bg-accent-purple/10',
    border: 'border-accent-purple/30',
    text: 'text-accent-purple',
    icon: 'text-accent-purple',
    badge: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
    dot: 'bg-accent-purple',
  },
  green: {
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
    text: 'text-accent-green',
    icon: 'text-accent-green',
    badge: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    dot: 'bg-accent-green',
  },
}

function Connector({ index, total }) {
  if (index >= total - 1) return null
  const pingColors = ['bg-accent-cyan', 'bg-accent-purple', 'bg-accent-green']
  const pingColor = pingColors[index % pingColors.length]

  return (
    <div className="hidden md:flex items-center justify-center w-8 shrink-0 relative">
      <div className="w-full h-px bg-surface-border relative overflow-visible">
        {/* Arrow tip */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderLeft: '6px solid rgba(0,212,255,0.4)',
          }}
        />
        {/* Pulsing dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${pingColor} opacity-80`} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DataPipeline() {
  const [activeStep, setActiveStep] = useState(null)
  const [visibleCards, setVisibleCards] = useState([])
  const [visibleTools, setVisibleTools] = useState({})
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.idx)
            setVisibleCards((prev) => (prev.includes(idx) ? prev : [...prev, idx]))
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )

    const cards = sectionRef.current?.querySelectorAll('[data-idx]')
    cards?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Trigger tool badges fade-in after card is visible
  useEffect(() => {
    visibleCards.forEach((idx) => {
      setTimeout(() => {
        setVisibleTools((prev) => ({ ...prev, [idx]: true }))
      }, 200 + idx * 80)
    })
  }, [visibleCards])

  const handleCardClick = (idx) => {
    setActiveStep(activeStep === idx ? null : idx)
  }

  const activeData = activeStep !== null ? pipelineSteps[activeStep] : null
  const activeColors = activeData ? COLOR_MAP[activeData.color] || COLOR_MAP.cyan : null

  return (
    <section id="pipeline" className="py-24 relative" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Data Pipeline</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
              interactive
            </span>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-2" />
          </div>
          <p className="mt-2 text-sm font-mono text-gray-500">// click each step to explore</p>
        </div>

        {/* Desktop: 4-column row */}
        <div className="hidden md:flex items-stretch gap-0">
          {pipelineSteps.map((step, idx) => {
            const colors = COLOR_MAP[step.color] || COLOR_MAP.cyan
            const isActive = activeStep === idx
            const isVisible = visibleCards.includes(idx)
            return (
              <div key={idx} className="flex items-center flex-1 min-w-0">
                <div
                  data-idx={idx}
                  onClick={() => handleCardClick(idx)}
                  className={`flex-1 cursor-pointer rounded-xl border p-5 transition-all duration-300 ${colors.bg} ${colors.border}
                    ${isActive ? 'ring-2 ring-offset-2 ring-offset-primary ' + colors.text.replace('text-', 'ring-') + ' scale-[1.03]' : 'hover:scale-[1.02] hover:shadow-lg'}
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
                  `}
                  style={{ transition: `opacity 0.5s ease ${idx * 0.1}s, transform 0.5s ease ${idx * 0.1}s, box-shadow 0.3s ease, scale 0.3s ease` }}
                >
                  {/* Icon */}
                  <div className="text-4xl text-center mb-3">{step.icon}</div>
                  {/* Label */}
                  <h3 className={`text-base font-bold text-center mb-1 ${colors.text}`}>{step.label}</h3>
                  {/* Desc */}
                  <p className="text-xs text-gray-400 text-center mb-4">{step.desc}</p>
                  {/* Tool badges */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {step.tools.map((tool, ti) => (
                      <span
                        key={ti}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${colors.badge}
                          ${visibleTools[idx] ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                        `}
                        style={{ transition: `opacity 0.3s ease ${ti * 0.07}s, transform 0.3s ease ${ti * 0.07}s` }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                  {/* Active indicator */}
                  {isActive && (
                    <div className={`mt-3 text-center text-xs font-mono ${colors.text} opacity-70`}>
                      ▲ click to close
                    </div>
                  )}
                </div>
                <Connector index={idx} total={pipelineSteps.length} />
              </div>
            )
          })}
        </div>

        {/* Desktop detail panel */}
        {activeData && (
          <div
            className={`hidden md:block mt-6 rounded-xl border p-6 ${activeColors.bg} ${activeColors.border} transition-all duration-300`}
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-3xl">{activeData.icon}</span>
              <div>
                <h4 className={`text-lg font-bold ${activeColors.text}`}>{activeData.label}</h4>
                <p className="text-sm text-gray-300 mt-1">{activeData.details}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {activeData.tools.map((tool, ti) => (
                <span key={ti} className={`px-2 py-0.5 rounded text-xs font-mono border ${activeColors.badge}`}>
                  {tool}
                </span>
              ))}
            </div>
            <pre className="bg-primary/60 border border-surface-border rounded-lg p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {activeData.example}
            </pre>
          </div>
        )}

        {/* Mobile: vertical accordion */}
        <div className="md:hidden space-y-3">
          {pipelineSteps.map((step, idx) => {
            const colors = COLOR_MAP[step.color] || COLOR_MAP.cyan
            const isOpen = activeStep === idx
            const isVisible = visibleCards.includes(idx)
            return (
              <div
                key={idx}
                data-idx={idx}
                className={`rounded-xl border transition-all duration-300 overflow-hidden
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                `}
                style={{ transition: `opacity 0.45s ease ${idx * 0.1}s, transform 0.45s ease ${idx * 0.1}s` }}
              >
                {/* Header row */}
                <button
                  onClick={() => handleCardClick(idx)}
                  className={`w-full flex items-center gap-4 p-4 ${colors.bg} ${colors.border} transition-all`}
                >
                  <span className="text-2xl shrink-0">{step.icon}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-bold ${colors.text}`}>{step.label}</p>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
                    {step.tools.slice(0, 2).map((t, ti) => (
                      <span key={ti} className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${colors.badge}`}>{t}</span>
                    ))}
                    {step.tools.length > 2 && (
                      <span className="text-[9px] font-mono text-gray-500">+{step.tools.length - 2}</span>
                    )}
                  </div>
                  <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-xs ${colors.text} shrink-0`} />
                </button>

                {/* Expandable detail */}
                {isOpen && (
                  <div className={`border-t ${colors.border} p-4 bg-primary/50`}>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{step.details}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {step.tools.map((tool, ti) => (
                        <span key={ti} className={`px-2 py-0.5 rounded text-xs font-mono border ${colors.badge}`}>{tool}</span>
                      ))}
                    </div>
                    <pre className="bg-primary/80 border border-surface-border rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {step.example}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
