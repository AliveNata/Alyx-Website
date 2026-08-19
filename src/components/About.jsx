import { useState, useEffect, useRef } from 'react'
import { pipelineSteps } from '../data/portfolio'

const facts = [
  { label: 'Location', value: 'Jakarta' },
  { label: 'Focus', value: 'Data Engineer · BI' },
  { label: 'Experience', value: '7+ Years' },
  { label: 'Status', value: 'Open to Work', accent: true },
]

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// Log action verbs matching pipelineSteps order (Extract, Transform, Load, Visualize)
const STEP_ACTIONS = ['reading raw sources', 'cleaning & modeling', 'writing to warehouse', 'rendering dashboards']

export default function About() {
  const scrollRef = useRef(null)
  const barRef = useRef(null)
  const barFillRef = useRef(null)
  const barPctRef = useRef(null)
  const barEmptyRef = useRef(null)
  const widthRef = useRef(48)
  const lastStageRef = useRef(-1)
  const [stage, setStage] = useState(0) // 0 = idle, 1..N
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    setReduce(matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduce) return
    const el = scrollRef.current
    if (!el) return
    const N = pipelineSteps.length
    let raf = null

    const update = () => {
      raf = null
      // Non-pinned, tightly-timed scroll link (no dead gap to the next section):
      // p=0 when the block's top sits mid-viewport (pipeline just prominent),
      // p=1 when the block's top has risen near the top of the viewport.
      const vh = window.innerHeight
      const startTop = 0.70 * vh   // begin: pipeline header ~70% down the viewport
      const endTop = 0.08 * vh     // finish: header near the top (next section arriving)
      const rectTop = el.getBoundingClientRect().top
      const p = clamp((startTop - rectTop) / (startTop - endTop), 0, 1)

      // CLI progress bar - the bracket AND % ride the head: [====>] 45% .......
      const label = ` ${String(Math.round(p * 100)).padStart(3, ' ')}% ` // 6 chars, travels
      const inner = Math.max(1, widthRef.current - 8) // fill + trailing dots
      const filled = clamp(Math.round(p * inner), 0, inner)
      if (barFillRef.current) {
        barFillRef.current.textContent =
          filled <= 0 ? '' : filled >= inner ? '='.repeat(inner) : '='.repeat(filled - 1) + '>'
      }
      if (barPctRef.current) barPctRef.current.textContent = label
      if (barEmptyRef.current) barEmptyRef.current.textContent = '.'.repeat(Math.max(0, inner - filled))

      let active = 0
      for (let i = 0; i < N; i++) {
        const cp = clamp((p - i * (1 / N)) / ((1 / N) * 0.85), 0, 1)
        if (cp > 0.55) active = i
      }

      const s = p <= 0.01 ? 0 : active + 1
      if (s !== lastStageRef.current) {
        lastStageRef.current = s
        setStage(s)
      }
    }

    // Measure how many mono chars fit the bar container (for a full-width bar)
    const measure = () => {
      const b = barRef.current
      if (!b) return
      const cs = getComputedStyle(b)
      const probe = document.createElement('span')
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;top:-9999px;left:-9999px'
      probe.style.fontFamily = cs.fontFamily
      probe.style.fontSize = cs.fontSize
      probe.style.letterSpacing = cs.letterSpacing
      probe.textContent = '='.repeat(100)
      b.appendChild(probe)
      const cw = probe.getBoundingClientRect().width / 100
      b.removeChild(probe)
      if (cw > 0) widthRef.current = Math.max(24, Math.floor(b.clientWidth / cw) - 3) // reserve for [ ]
    }

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const onResize = () => { measure(); onScroll() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    measure()
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduce])

  const activeIdx = Math.max(0, stage - 1)
  const detail = pipelineSteps[activeIdx]

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
        <div className="grid lg:grid-cols-[5fr_7fr] gap-8 lg:gap-20 items-start">
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
      </div>

      {/* ── how_i_work.sh — scroll-driven pipeline ── */}
      {reduce ? (
        // Reduced-motion: static completed log, no scroll choreography
        <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16 mt-20">
          <div className="flex items-baseline gap-3 font-mono text-sm mb-6">
            <span><span className="text-accent-green">$</span> how_i_work.sh</span>
          </div>
          <div className="border border-surface-border rounded-xl bg-surface-dark overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border font-mono text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-accent-green" style={{ boxShadow: '0 0 8px #00ff88' }} />
              pipeline.log
            </div>
            <div className="p-4 font-mono text-[12.5px] leading-[1.9]">
              <div className="text-gray-500">$ ./how_i_work.sh --run</div>
              {pipelineSteps.map((s, i) => (
                <div key={i}>
                  <span className="text-gray-600">[{i + 1}/{pipelineSteps.length}]</span>{' '}
                  <span className="inline-block w-[76px] text-white">{s.label.toLowerCase()}</span>
                  <span className="text-gray-600">: </span>
                  <span className="text-accent-green">{STEP_ACTIONS[i]} [OK]</span>
                </div>
              ))}
              <div className="text-accent-green mt-1">pipeline complete <span className="text-gray-600">·</span> 0 errors <span className="text-gray-600">·</span> ~1.2M rows/run</div>
            </div>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16 mt-20">
          <div>
            <div className="w-full">
              {/* Head */}
              <div className="flex items-baseline justify-between font-mono text-sm mb-8">
                <span><span className="text-accent-green">$</span> how_i_work.sh</span>
                <span className="text-gray-600 text-xs">stage <span className="text-accent-cyan">{stage}</span>/{pipelineSteps.length} · {stage === 0 ? 'idle' : detail.label.toLowerCase()}</span>
              </div>

              {/* CLI-style ASCII progress bar (full width, % rides the head) */}
              <div ref={barRef} className="font-mono text-[13px] sm:text-sm mb-8 whitespace-pre overflow-hidden">
                <span className="text-gray-600">[</span><span ref={barFillRef} className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent"></span><span className="text-gray-600">]</span><span ref={barPctRef} className="text-accent-cyan tabular-nums"></span><span ref={barEmptyRef} className="text-gray-700"></span>
              </div>

              {/* Live terminal log — appends a line per stage, reversible with scroll */}
              <div className="mt-7 border border-surface-border rounded-xl bg-surface-dark overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border font-mono text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-accent-green" style={{ boxShadow: '0 0 8px #00ff88' }} />
                  pipeline.log
                </div>
                <div className="p-4 grid md:grid-cols-[1.35fr_1fr] gap-6">
                  {/* running log */}
                  <div className="font-mono text-[12.5px] leading-[1.85] min-h-[132px]">
                    <div className="text-gray-500">$ ./how_i_work.sh --run</div>
                    {pipelineSteps.map((s, i) => {
                      const done = i < stage - 1 || stage === pipelineSteps.length
                      const running = i === stage - 1 && stage !== pipelineSteps.length
                      if (!done && !running) return null
                      return (
                        <div key={i}>
                          <span className="text-gray-600">[{i + 1}/{pipelineSteps.length}]</span>{' '}
                          <span className="inline-block w-[76px] text-white">{s.label.toLowerCase()}</span>
                          <span className="text-gray-600">: </span>
                          {done ? (
                            <span className="text-accent-green">{STEP_ACTIONS[i]} <span className="text-accent-green">[OK]</span></span>
                          ) : (
                            <span className="text-accent-cyan">{STEP_ACTIONS[i]}...<span className="inline-block w-1.5 h-3.5 bg-accent-cyan ml-1 align-middle animate-pulse" /></span>
                          )}
                        </div>
                      )
                    })}
                    {stage === pipelineSteps.length && (
                      <div className="text-accent-green mt-1">pipeline complete <span className="text-gray-600">·</span> 0 errors <span className="text-gray-600">·</span> ~1.2M rows/run</div>
                    )}
                  </div>
                  {/* active stage code */}
                  <pre key={activeIdx} className="animate-fade-in bg-primary border border-surface-border rounded-lg p-3 font-mono text-[11.5px] text-gray-300 overflow-x-auto leading-relaxed"><code>{detail.example}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
