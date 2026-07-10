import { useState } from 'react'
import { experiencesIT, experiencesNonIT, experiencesFreelance } from '../data/portfolio'

const TABS = [
  { key: 'IT', label: 'IT', data: experiencesIT, tone: 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10' },
  { key: 'Freelance', label: 'Freelance', data: experiencesFreelance, tone: 'text-accent-green border-accent-green/40 bg-accent-green/10' },
  { key: 'Non-IT', label: 'Non-IT', data: experiencesNonIT, tone: 'text-accent-purple border-accent-purple/40 bg-accent-purple/10' },
]
const PREVIEW = 3

export default function Experience() {
  const [tab, setTab] = useState('IT')
  const [expanded, setExpanded] = useState(false)

  const active = TABS.find((t) => t.key === tab)
  const list = expanded ? active.data : active.data.slice(0, PREVIEW)

  return (
    <section id="experience" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-5">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">03</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>Experience</h2>
        </div>
        <p className="section-animate font-mono text-[12.5px] text-gray-600 ml-[39px] mb-11">// 15 roles across IT, freelance &amp; earlier career</p>

        {/* Tabs */}
        <div className="section-animate flex flex-wrap gap-1 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setExpanded(false) }}
              className={`font-mono text-xs px-3.5 py-2 rounded-lg border transition-all ${
                tab === t.key ? t.tone : 'text-gray-400 border-surface-border hover:text-white'
              }`}
            >
              {t.label} ({t.data.length})
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="section-animate">
          {list.map((exp, i) => (
            <div key={i} className="grid md:grid-cols-[150px_1fr] gap-4 md:gap-14 py-7 border-t border-surface-border first:border-t-0">
              <div>
                <div className="font-mono text-xs text-accent-cyan">{exp.period}</div>
                <div className="font-mono text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  {exp.location}{exp.workType ? ` · ${exp.workType}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[19px] font-bold tracking-tight text-white">{exp.role}</div>
                <div className="text-gray-400 text-sm mt-0.5 font-mono">
                  {exp.company}{exp.duration ? ` · ${exp.duration}` : ''}
                </div>
                {exp.highlight && (
                  <div className="mt-3 p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg">
                    <p className="text-xs font-mono text-accent-green mb-1">⭐ {exp.highlight.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{exp.highlight.detail}</p>
                  </div>
                )}
                <ul className="mt-3 text-gray-400 text-[14.5px] flex flex-col gap-1.5">
                  {exp.description.map((d, j) => (
                    <li key={j} className="pl-[18px] relative">
                      <span className="absolute left-0 top-[3px] text-accent-green text-[11px]">▸</span>{d}
                    </li>
                  ))}
                </ul>
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {exp.technologies.map((t, k) => (
                      <span key={k} className="font-mono text-[10.5px] px-2 py-[3px] border border-surface-border rounded text-gray-400">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {active.data.length > PREVIEW && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="section-animate mt-6 w-full font-mono text-[12.5px] text-accent-cyan border border-dashed border-accent-cyan/35 rounded-lg py-3 hover:bg-accent-cyan/5 transition-all"
          >
            {expanded ? '$ show_less()' : `$ show_more() // +${active.data.length - PREVIEW}`}
          </button>
        )}
      </div>
    </section>
  )
}
