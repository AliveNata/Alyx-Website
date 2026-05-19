import { useState } from 'react'
import { experiencesIT, experiencesNonIT, experiencesFreelance, awards, certificates } from '../data/portfolio'

const workTypeColors = {
  'Remote': 'bg-accent-green/10 text-accent-green border-accent-green/20',
  'Hybrid': 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  'Onsite': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

// Icons used inside award metrics
function MetricIcon({ type }) {
  if (type === 'award') return <i className="bi bi-shield-check text-xs leading-none shrink-0" />
  if (type === 'building') return <i className="bi bi-building text-xs leading-none shrink-0" />
  if (type === 'medal') return <i className="bi bi-award text-xs leading-none shrink-0" />
  return null
}

function AwardCard({ item }) {
  return (
    <div className="group relative bg-surface-card border border-surface-border rounded-xl p-4 card-glow overflow-hidden">
      {/* Decorative gradient corner */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent-blue/10 rounded-full blur-2xl group-hover:bg-accent-blue/20 transition-all" />

      <div className="relative">
        {/* Header with icon + title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-cyan/20 border border-accent-blue/30 flex items-center justify-center text-xl shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
              Achievement
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.description}</p>

        {/* Metrics */}
        <div className="space-y-1.5 pt-3 border-t border-surface-border">
          {item.metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`${
                m.icon === 'award' ? 'text-accent-blue' :
                m.icon === 'building' ? 'text-accent-cyan' :
                'text-accent-blue'
              }`}>
                <MetricIcon type={m.icon} />
              </span>
              <span className="text-gray-300 font-mono">{m.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CertificateCard({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-surface-card border border-surface-border rounded-xl p-4 card-glow overflow-hidden block"
    >
      {/* Decorative gradient corner */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-accent-purple/10 rounded-full blur-2xl group-hover:bg-accent-purple/20 transition-all" />

      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple/20 to-fuchsia-500/20 border border-accent-purple/30 flex items-center justify-center text-xl shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight group-hover:text-accent-purple transition-colors">{item.title}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                {item.issuer}
              </span>
              <span className="text-[10px] font-mono text-gray-500">• {item.date}</span>
            </div>
          </div>
          {/* External link icon */}
          <i className="bi bi-box-arrow-up-right text-sm leading-none text-gray-600 group-hover:text-accent-purple transition-colors shrink-0" />
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.description}</p>

        {/* View cert footer */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between">
          <span className="text-xs font-mono text-gray-500">// verified_credential</span>
          <span className="text-xs font-mono text-accent-purple group-hover:translate-x-1 transition-transform">
            view cert →
          </span>
        </div>
      </div>
    </a>
  )
}

function ExperienceCard({ exp, i, total, variant }) {
  const dotColor =
    variant === 'IT' ? 'border-accent-cyan bg-accent-cyan/20'
    : variant === 'Freelance' ? 'border-accent-green bg-accent-green/20'
    : 'border-accent-purple bg-accent-purple/20'

  return (
    <div className="relative flex gap-6">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-2 shrink-0 z-10 ${dotColor}`} />
        {i < total - 1 && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-surface-border to-transparent min-h-[40px]" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 flex-1">
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 card-glow">
          {/* Period + Work Type badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-mono text-gray-500">📅 {exp.period}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${workTypeColors[exp.workType] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
              {exp.workType}
            </span>
            <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
              <i className="bi bi-geo-alt-fill text-xs leading-none" />
              {exp.location}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-white">{exp.role}</h3>
          <p className="text-sm text-accent-cyan font-mono mb-3">
            {exp.company}
            {exp.duration && <span className="text-gray-500"> · {exp.duration}</span>}
          </p>

          {exp.projects && exp.projects.length > 0 && (
            <div className="mb-3 p-3 bg-primary/40 border border-surface-border rounded-lg">
              <p className="text-xs font-mono text-accent-green mb-1.5">// projects</p>
              <ul className="space-y-1">
                {exp.projects.map((p, k) => (
                  <li key={k} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-accent-cyan mt-0.5">◆</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-2">
            {exp.description.map((desc, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-accent-green mt-1 shrink-0">▸</span>
                {desc}
              </li>
            ))}
          </ul>

          {exp.highlight && (
            <div className="mt-3 p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg">
              <p className="text-xs font-mono text-accent-green mb-1">⭐ Project Highlight</p>
              <p className="text-sm font-semibold text-white mb-1">{exp.highlight.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{exp.highlight.detail}</p>
            </div>
          )}

          {exp.technologies && exp.technologies.length > 0 && (
            <div className="mt-4 pt-4 border-t border-surface-border flex flex-wrap gap-1.5">
              {exp.technologies.map((t, k) => (
                <span key={k} className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent-cyan/5 text-accent-cyan/80 border border-accent-cyan/20">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PREVIEW_COUNT = 3

export default function Experience() {
  const [expTab, setExpTab] = useState('IT')
  const [achTab, setAchTab] = useState('Awards')
  const [showAllIT, setShowAllIT] = useState(false)
  const [showAllFreelance, setShowAllFreelance] = useState(false)
  const [showAllNonIT, setShowAllNonIT] = useState(false)

  const allExperiences =
    expTab === 'IT' ? experiencesIT
    : expTab === 'Freelance' ? experiencesFreelance
    : experiencesNonIT

  const showAll =
    expTab === 'IT' ? showAllIT
    : expTab === 'Freelance' ? showAllFreelance
    : showAllNonIT

  const setShowAll = (val) => {
    if (expTab === 'IT') setShowAllIT(val)
    else if (expTab === 'Freelance') setShowAllFreelance(val)
    else setShowAllNonIT(val)
  }

  const currentExperiences = showAll ? allExperiences : allExperiences.slice(0, PREVIEW_COUNT)

  return (
    <section id="experience" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3">
            <span className="text-accent-cyan font-mono text-sm">04.</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Experience</h2>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-4" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Experience section */}
          <div className="lg:col-span-2">
            {/* IT / Non-IT tabs */}
            <div className="section-animate flex gap-2 mb-6">
              <button
                onClick={() => { setExpTab('IT'); setShowAllIT(false) }}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  expTab === 'IT'
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                }`}
              >
                💻 IT Experience
                <span className="ml-2 text-xs opacity-60">({experiencesIT.length})</span>
              </button>
              <button
                onClick={() => { setExpTab('Freelance'); setShowAllFreelance(false) }}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  expTab === 'Freelance'
                    ? 'bg-accent-green/10 text-accent-green border border-accent-green/30'
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                }`}
              >
                💼 Freelance
                <span className="ml-2 text-xs opacity-60">({experiencesFreelance.length})</span>
              </button>
              <button
                onClick={() => { setExpTab('Non-IT'); setShowAllNonIT(false) }}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  expTab === 'Non-IT'
                    ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30'
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                }`}
              >
                🏢 Non-IT Experience
                <span className="ml-2 text-xs opacity-60">({experiencesNonIT.length})</span>
              </button>
            </div>

            <div className="section-animate">
              {currentExperiences.map((exp, i) => (
                <ExperienceCard
                  key={i}
                  exp={exp}
                  i={i}
                  total={currentExperiences.length}
                  variant={expTab}
                />
              ))}
            </div>

            {/* Show More / Less */}
            {allExperiences.length > PREVIEW_COUNT && (
              <div className="mt-2 mb-6">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className={`w-full py-2.5 font-mono text-sm rounded-lg border transition-all ${
                    expTab === 'IT'
                      ? 'border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10'
                      : expTab === 'Freelance'
                      ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                      : 'border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10'
                  }`}
                >
                  {showAll
                    ? `↑ Show Less`
                    : `↓ Show More (${allExperiences.length - PREVIEW_COUNT} more)`}
                </button>
              </div>
            )}
          </div>

          {/* Achievements & Certificates sidebar */}
          <div className="section-animate">
            {/* Awards / Certificates tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAchTab('Awards')}
                className={`flex-1 px-3 py-2 rounded-lg font-mono text-xs transition-all ${
                  achTab === 'Awards'
                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                }`}
              >
                🎖️ Awards ({awards.length})
              </button>
              <button
                onClick={() => setAchTab('Certificates')}
                className={`flex-1 px-3 py-2 rounded-lg font-mono text-xs transition-all ${
                  achTab === 'Certificates'
                    ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30'
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
                }`}
              >
                📜 Certificates ({certificates.length})
              </button>
            </div>

            <div className="space-y-4">
              {achTab === 'Awards'
                ? awards.map((item) => <AwardCard key={item.id} item={item} />)
                : certificates.map((item) => <CertificateCard key={item.id} item={item} />)
              }
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
