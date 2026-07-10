import { useState } from 'react'
import { pipelineSteps } from '../data/portfolio'

const colorMap = {
  cyan: { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan', border: 'border-accent-cyan/30' },
  purple: { bg: 'bg-accent-purple/10', text: 'text-accent-purple', border: 'border-accent-purple/30' },
  green: { bg: 'bg-accent-green/10', text: 'text-accent-green', border: 'border-accent-green/30' },
  blue: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/30' },
}

const facts = [
  { label: 'Location', value: 'Jakarta' },
  { label: 'Focus', value: 'Data Engineer · BI' },
  { label: 'Experience', value: '7+ Years' },
  { label: 'Status', value: 'Open to Work', accent: true },
]

export default function About() {
  const [activeStep, setActiveStep] = useState(null)

  return (
    <section id="about" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-14">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">01</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight max-w-[18ch]" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>
            A data professional, not a dashboard factory.
          </h2>
        </div>

        {/* Pull quote + body + facts */}
        <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-20 items-start mb-20">
          <p className="section-animate font-bold tracking-[-0.02em] text-white leading-snug" style={{ fontSize: 'clamp(22px,2.9vw,32px)' }}>
            Seven years turning <span className="text-accent-cyan">complex, messy data</span> into systems people actually <span className="text-accent-green">run on</span>, daily and at the strategy table.
          </p>
          <div>
            <div className="section-animate text-gray-400 leading-relaxed max-w-[54ch] space-y-4" style={{ fontSize: 15.5 }}>
              <p>Specialized in building scalable data pipelines, automating ETL processes, data modeling, and BI reporting that drive real business impact, from raw ingestion and orchestration to the BI layer regional teams open every morning.</p>
              <p>My work sits where reliability meets clarity: pipelines that don't page you at 3am, and reporting leaders trust enough to act on.</p>
            </div>
            <div className="section-animate grid grid-cols-2 gap-px bg-surface-border border border-surface-border mt-8">
              {facts.map((f) => (
                <div key={f.label} className="bg-primary px-4 py-4">
                  <div className="font-mono text-[10.5px] tracking-widest uppercase text-gray-600">{f.label}</div>
                  <div className={`text-[15.5px] font-semibold mt-1.5 ${f.accent ? 'text-accent-green' : 'text-white'}`}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive how_i_work pipeline */}
        <div className="section-animate">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-mono text-accent-cyan flex items-center gap-2">
              <span className="text-accent-green">$</span> how_i_work.sh
            </h3>
            <span className="text-xs font-mono text-gray-600">click to expand ↕</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pipelineSteps.map((step, i) => {
              const isActive = activeStep === i
              const colors = colorMap[step.color]
              return (
                <div key={step.label} className={isActive ? 'sm:col-span-2 lg:col-span-4' : ''}>
                  <button
                    onClick={() => setActiveStep(isActive ? null : i)}
                    className={`w-full text-left border rounded-xl p-5 transition-all duration-300 ${
                      isActive ? `${colors.bg} ${colors.border}` : 'bg-surface-card border-surface-border hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{step.icon}</span>
                      <span className="font-mono text-[10px] text-gray-600">// step_{i + 1}</span>
                    </div>
                    <div className={`text-lg font-extrabold tracking-tight mt-3 ${isActive ? colors.text : 'text-white'}`}>{step.label}</div>
                    <div className="font-mono text-[11px] text-accent-cyan mt-1">{step.desc}</div>
                    {isActive && (
                      <div className="mt-4 animate-fade-in">
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">{step.details}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {step.tools.map((t) => (
                            <span key={t} className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-[10px] font-mono rounded border ${colors.border}`}>{t}</span>
                          ))}
                        </div>
                        <pre className="bg-surface-dark p-3 rounded text-xs font-mono text-gray-300 overflow-x-auto border border-surface-border"><code>{step.example}</code></pre>
                      </div>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
