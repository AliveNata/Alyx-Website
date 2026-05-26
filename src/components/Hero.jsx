import { useState, useEffect, useRef } from 'react'
import { personalInfo } from '../data/portfolio'

const techStack = [
  { name: 'Python', icon: '🐍' },
  { name: 'SQL', icon: '🗄️' },
  { name: 'BigQuery', icon: '☁️' },
  { name: 'dbt', icon: '🔧' },
  { name: 'Power BI', icon: '📊' },
]

const roles = [
  "Data Engineer",
  "Business Intelligence",
  "Senior Data Analyst",
  "Web Developer",
  "Business Analyst",
  "Analytics Engineer"
]

export default function Hero() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('typing') // 'typing' | 'pausing' | 'deleting'
  const timeoutRef = useRef(null)

  useEffect(() => {
    const currentRole = roles[roleIndex]

    if (phase === 'typing') {
      if (text.length < currentRole.length) {
        timeoutRef.current = setTimeout(() => {
          setText(currentRole.substring(0, text.length + 1))
        }, 80)
      } else {
        setPhase('pausing')
      }
    } else if (phase === 'pausing') {
      timeoutRef.current = setTimeout(() => {
        setPhase('deleting')
      }, 1800)
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setText(currentRole.substring(0, text.length - 1))
        }, 40)
      } else {
        setRoleIndex((prev) => (prev + 1) % roles.length)
        setPhase('typing')
      }
    }

    return () => clearTimeout(timeoutRef.current)
  }, [text, phase, roleIndex])

  return (
    <section id="home" className="min-h-screen flex items-center relative overflow-hidden">

      {/* Photo — right side, clearly visible */}
      <div className="absolute inset-y-0 right-0 w-[48%] lg:w-[42%]">
        <img
          src="/profile.jpg"
          alt="Alief Akbar"
          className="w-full h-full object-cover object-[center_10%]"
          style={{ imageRendering: 'crisp-edges', filter: 'contrast(1.08) saturate(1.06) brightness(1.02)' }}
        />
        {/* Narrow left-edge fade — theme-aware */}
        <div className="hero-fade-side absolute inset-0" style={{ width: '52%' }} />
        {/* Bottom fade — theme-aware */}
        <div className="hero-fade-bottom absolute bottom-0 left-0 right-0 h-28" />
      </div>

      {/* Left: Text content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-10">
        <div className="max-w-lg space-y-4">

          {/* Available badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-card/80 backdrop-blur-sm border border-accent-green/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-accent-green/80">Available for work</span>
          </div>

          {/* Name */}
          <div className="space-y-0">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
              <span className="text-white">{personalInfo.name.split(' ')[0]}</span>
              <br />
              <span
                className="bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent"
                style={{ textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.3))' }}
              >
                {personalInfo.name.split(' ')[1]}
              </span>
            </h1>
          </div>

          {/* Typing role */}
          <div className="flex items-center gap-2 min-h-[1.8rem]">
            <span className="text-accent-green font-mono text-xs">$</span>
            <span className="text-base sm:text-lg font-mono text-gray-400">
              {text}
              <span
                className="inline-block w-[2px] h-4 bg-accent-cyan ml-0.5 align-middle"
                style={{ animation: 'blink-caret 1s step-end infinite' }}
              />
            </span>
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-accent-cyan/40" />

          {/* Description */}
          <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
            Building scalable data pipelines &amp; automated BI systems.
            Turning complex data into reliable insights with{' '}
            <span className="text-accent-green font-medium">SQL</span>,{' '}
            <span className="text-accent-cyan font-medium">Python</span>, and a modern data stack.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#projects"
              className="px-5 py-2.5 bg-accent-cyan text-primary font-semibold text-sm rounded-lg hover:bg-accent-cyan/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-cyan/30 transition-all duration-200"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="px-5 py-2.5 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:border-accent-cyan/50 hover:text-accent-cyan transition-all duration-200"
            >
              Get In Touch
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-3 border-t border-surface-border/40">
            {[
              { value: `${new Date().getFullYear() - 2019}+`, label: 'Years Exp' },
              { value: '10M+', label: 'Records/Day' },
              { value: '20+', label: 'Projects' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-3">
                {i > 0 && <div className="w-px h-8 bg-surface-border/60" />}
                <div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[11px] font-mono text-gray-600 mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-8 lg:left-16 animate-bounce z-10">
        <i className="bi bi-arrow-down text-sm text-gray-600 leading-none" />
      </div>
    </section>
  )
}
