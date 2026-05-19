import { useState } from 'react'
import { personalInfo, pipelineSteps } from '../data/portfolio'

const colorMap = {
  cyan: { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan', border: 'border-accent-cyan/30' },
  purple: { bg: 'bg-accent-purple/10', text: 'text-accent-purple', border: 'border-accent-purple/30' },
  green: { bg: 'bg-accent-green/10', text: 'text-accent-green', border: 'border-accent-green/30' },
  blue: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/30' },
}

export default function About() {
  const [activeStep, setActiveStep] = useState(null)

  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3">
            <span className="text-accent-cyan font-mono text-sm">01.</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">About Me</h2>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-4" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Bio */}
          <div className="section-animate space-y-6">
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <div className="terminal-header mb-4 -mx-6 -mt-6 rounded-none">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-3 text-xs font-mono text-gray-500">about.md</span>
              </div>

              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Hi, I'm <span className="text-white font-semibold">Alief</span>, a data professional with a strong background in{' '}
                  <span className="text-accent-cyan">Business Intelligence</span> and{' '}
                  <span className="text-accent-purple">Data Engineering</span>.
                  Over the years, I've built end-to-end data solutions from data pipelines and automation to dashboards used for daily and strategic decision-making.
                </p>
                <p>
                  I've worked across multiple industries and collaborated with regional teams to deliver{' '}
                  <span className="text-accent-green">scalable, reliable data systems</span> that improve efficiency and business performance.
                </p>
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { label: 'Location', value: 'Indonesia' },
                  { label: 'Experience', value: '7+ Years' },
                  { label: 'Focus', value: 'Data Engineering' },
                  { label: 'Status', value: 'Open to Work' },
                ].map((fact) => (
                  <div key={fact.label} className="bg-primary/50 rounded-lg p-3 border border-surface-border">
                    <div className="text-xs font-mono text-gray-500">{fact.label}</div>
                    <div className="text-sm font-medium text-white mt-1">{fact.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive Pipeline */}
          <div className="section-animate">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-accent-cyan flex items-center gap-2">
                <span className="text-accent-green">$</span> how_i_work.sh
              </h3>
              <span className="text-xs font-mono text-gray-600">click to toggle ↕</span>
            </div>

            <div className="space-y-3">
              {pipelineSteps.map((step, i) => {
                const isActive = activeStep === i
                const colors = colorMap[step.color]
                return (
                  <div key={step.label} className="relative">
                    <button
                      onClick={() => setActiveStep(activeStep === i ? null : i)}
                      className={`w-full flex items-center gap-4 border rounded-lg p-4 transition-all duration-300 text-left ${
                        isActive
                          ? `${colors.bg} ${colors.border} shadow-lg`
                          : 'bg-surface-card border-surface-border hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center text-lg shrink-0`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono font-semibold text-sm ${isActive ? colors.text : 'text-white'}`}>
                            {step.label}
                          </span>
                          <span className="text-xs text-gray-600 font-mono">// step_{i + 1}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                      </div>
                      <span className={`transition-transform ${isActive ? 'rotate-90 ' + colors.text : 'text-gray-600'}`}>
                        ▸
                      </span>
                    </button>

                    {/* Expanded detail */}
                    {isActive && (
                      <div className={`mt-2 ml-14 p-4 bg-primary/70 border ${colors.border} rounded-lg animate-fade-in`}>
                        <p className="text-sm text-gray-300 mb-3">{step.details}</p>

                        <div className="mb-3">
                          <p className="text-xs font-mono text-gray-500 mb-1.5">// tools</p>
                          <div className="flex flex-wrap gap-1.5">
                            {step.tools.map(tool => (
                              <span
                                key={tool}
                                className={`px-2 py-0.5 ${colors.bg} ${colors.text} text-xs font-mono rounded border ${colors.border}`}
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-mono text-gray-500 mb-1.5">// example</p>
                          <pre className="bg-surface-dark p-3 rounded text-xs font-mono text-gray-300 overflow-x-auto border border-surface-border">
                            <code>{step.example}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Connector */}
                    {i < pipelineSteps.length - 1 && !isActive && (
                      <div className="ml-9 w-0.5 h-3 bg-gradient-to-b from-surface-border to-transparent" />
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
