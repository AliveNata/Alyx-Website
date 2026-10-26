import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { usePortfolio } from '../lib/PortfolioContext'
import { API_BASE } from '../lib/apiBase'

// PK-23: the submit goes to our own POST /api/contact, which forwards to the
// Google Sheet and emails the owner server-side and returns a real status. The
// client no longer talks to the Apps Script directly, so there is no endpoint to
// read or no-cors hop to make here.

const b64url = (str) => btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

function djb2(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & 0xffffffff
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function generateToken() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = b64url(JSON.stringify({ sub: 'contact_form', iss: 'alivyx.dev', iat: now, exp: now + 600, nonce: Math.random().toString(36).slice(2, 10) }))
  const signature = djb2(header + '.' + payload + '.alivyx_secret').slice(0, 12)
  return `${header}.${payload}.${signature}`
}

// primary_color tints Calendly's accent to the site cyan (applies on supported plans).
const CALENDLY_URL = 'https://calendly.com/alivenata/30min?primary_color=00d4ff'
const SOCIABUZZ_URL = 'https://sociabuzz.com/alyxlabs/support'

export default function Contact() {
  const { personalInfo } = usePortfolio()
  // `honeypot` is a hidden offscreen field a human never sees and a bot tends to
  // fill; the server silently drops a submission when it is non-empty (PK-23).
  const [form, setForm] = useState({ name: '', email: '', message: '', token: '', honeypot: '' })
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenStatus, setTokenStatus] = useState('idle')
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const [bookStep, setBookStep] = useState(null) // null | 'choose' | 'mentoring'
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setGeneratedToken(generateToken())
    setCountdown(15)
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setGeneratedToken(generateToken())
          setForm((f) => ({ ...f, token: '' }))
          setCopied(false)
          return 15
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!form.token) setTokenStatus('idle')
    else if (form.token.trim() === generatedToken.trim()) setTokenStatus('valid')
    else setTokenStatus('invalid')
  }, [form.token, generatedToken])

  // Load Calendly's popup widget assets once.
  useEffect(() => {
    if (document.getElementById('calendly-widget-js')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://assets.calendly.com/assets/external/widget.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.id = 'calendly-widget-js'
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const openCalendly = () => {
    if (window.Calendly) window.Calendly.initPopupWidget({ url: CALENDLY_URL })
    else window.open(CALENDLY_URL, '_blank', 'noopener') // fallback if the widget script is blocked
  }

  const chooseOpenToWork = () => { setBookStep(null); openCalendly() }
  const mentoringContinue = () => { setBookStep(null); openCalendly() }

  // Close the booking modal on Escape.
  useEffect(() => {
    if (!bookStep) return
    const onKey = (e) => { if (e.key === 'Escape') setBookStep(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bookStep])

  const isFormValid = form.name && form.email && form.message && tokenStatus === 'valid'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid || status === 'sending') return
    setStatus('sending')
    try {
      // Normal fetch (not no-cors): the server reads the JSON result, so 'sent'
      // now means the message actually reached Alief, and a failure is a real
      // non-ok status. Clear the form only on a confirmed send; keep it on error.
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message, honeypot: form.honeypot }),
      })
      if (!res.ok) throw new Error('contact submit failed')
      setStatus('sent')
      setForm({ name: '', email: '', message: '', token: '', honeypot: '' })
      setTimeout(() => setStatus(null), 4000)
    } catch (err) {
      setStatus('error')
      setTimeout(() => setStatus(null), 4000)
    }
  }

  // Let the feedback toast be dismissed early; the handleSubmit timeout still clears status on its own.
  const dismissToast = () => setStatus(null)

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) { /* ignore */ }
  }

  const [h, p, s] = generatedToken.split('.')

  return (
    <section id="contact" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-5">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">06</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>Get in touch</h2>
        </div>
        <p className="section-animate font-mono text-[12.5px] text-gray-600 ml-[39px] mb-12">// open to full-time, freelance &amp; consulting</p>

        {/* Centered close statement */}
        <div className="section-animate text-center max-w-[760px] mx-auto mb-12 sm:mb-16">
          <h3 className="font-black tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(30px,5vw,58px)' }}>
            Let's build something <span className="bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent">worth running.</span>
          </h3>
          <p className="text-gray-400 text-[15.5px] mt-4 max-w-[52ch] mx-auto">
            Open to full-time Data Engineer / BI roles, freelance pipelines &amp; dashboarding. I'd love to hear about your project.
          </p>
        </div>

        {/* Book a meeting (Calendly) */}
        <div className="section-animate text-center -mt-8 sm:-mt-10 mb-12 sm:mb-14">
          <button type="button" onClick={() => setBookStep('choose')}
            className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10 hover:border-accent-cyan transition-all">
            Book a meeting
          </button>
          <p className="font-mono text-[11.5px] text-gray-600 mt-3">// prefer a quick call? grab a 30-min slot</p>
        </div>

        {/* Terminal form */}
        <form onSubmit={handleSubmit} className="section-animate max-w-[880px] mx-auto border border-surface-border rounded-xl overflow-hidden bg-surface-card">
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500" />
            <div className="terminal-dot bg-yellow-500" />
            <div className="terminal-dot bg-green-500" />
            <span className="ml-3 text-xs font-mono text-gray-500">send_message.sh</span>
          </div>

          <div className="p-6 grid sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block font-mono text-[11px] text-gray-500 mb-2"><span className="text-accent-purple">const</span> name =</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your Name"
                className="w-full px-3.5 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-[13px] focus:outline-none focus:border-accent-cyan/50 transition-all" />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-gray-500 mb-2"><span className="text-accent-purple">const</span> email =</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com"
                className="w-full px-3.5 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-[13px] focus:outline-none focus:border-accent-cyan/50 transition-all" />
            </div>

            {/* message */}
            <div className="flex flex-col">
              <label className="block font-mono text-[11px] text-gray-500 mb-2"><span className="text-accent-purple">const</span> message =</label>
              <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell me about your project..."
                className="w-full flex-1 min-h-[180px] px-3.5 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-[13px] focus:outline-none focus:border-accent-cyan/50 transition-all resize-none" />
            </div>

            {/* token */}
            <div>
              <div className="flex items-center justify-between mb-2 font-mono text-[11px]">
                <span className="text-gray-500"><span className="text-accent-purple">Authorization</span>: Bearer</span>
                {tokenStatus === 'valid' && <span className="text-accent-green flex items-center gap-1"><i className="bi bi-check-circle-fill leading-none" /> Verified</span>}
                {tokenStatus === 'invalid' && <span className="text-red-400 flex items-center gap-1"><i className="bi bi-x-circle-fill leading-none" /> Invalid</span>}
              </div>
              <div className="bg-primary border border-surface-border rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2 font-mono text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5"><i className="bi bi-shield-lock-fill leading-none" /> Your Access Token</span>
                  <div className="flex gap-1.5 items-center">
                    <button type="button" onClick={copyToken} className="text-accent-cyan hover:bg-accent-cyan/10 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                      <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'} leading-none`} />{copied ? 'Copied' : 'Copy'}
                    </button>
                    <span className="text-accent-purple border border-surface-border rounded px-1.5 py-0.5 flex items-center gap-1">
                      <i className={`bi bi-arrow-repeat leading-none ${countdown <= 5 ? 'animate-spin' : ''}`} />
                      <span className={countdown <= 5 ? 'text-red-400' : ''}>{countdown}s</span>
                    </span>
                  </div>
                </div>
                <div className="font-mono text-[10px] leading-relaxed break-all">
                  <span className="text-red-400">{h}</span><span className="text-gray-500">.</span>
                  <span className="text-accent-purple">{p}</span><span className="text-gray-500">.</span>
                  <span className="text-accent-cyan">{s}</span>
                </div>
              </div>
              <input type="text" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} placeholder="Paste the token above to unlock send..."
                className={`w-full px-3.5 py-3 bg-primary border rounded-lg text-white placeholder-gray-600 font-mono text-xs focus:outline-none transition-all ${
                  tokenStatus === 'valid' ? 'border-accent-green/50' : tokenStatus === 'invalid' ? 'border-red-500/50' : 'border-surface-border focus:border-accent-cyan/50'
                }`} />
            </div>

            {/* Honeypot (PK-23): offscreen (not display:none, so a bot still fills it),
                out of the tab order. The name is deliberately non-semantic so no browser
                autofill token matches it and fills it for a real person. A visually-hidden
                label tells a screen-reader user to skip it. Only a bot completes it; the
                server drops any filled value. Same pattern as the chat lead form. */}
            <label className="sm:col-span-2" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
              Leave this field blank
              <input
                type="text"
                name="contact_ref_x"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
              />
            </label>

            {/* send */}
            <button type="submit" disabled={!isFormValid || status === 'sending'}
              className={`sm:col-span-2 w-full py-3 font-mono text-sm font-bold rounded-lg transition-all ${
                isFormValid ? 'bg-gradient-to-r from-accent-cyan to-accent-blue text-primary cursor-pointer hover:shadow-lg hover:shadow-accent-cyan/25' : 'bg-surface-border text-gray-500 cursor-not-allowed opacity-60'
              }`}>
              {status === 'sending' ? '$ sending...'
                : status === 'sent' ? '[ok] Message Sent!'
                : status === 'error' ? '[x] Failed, try again'
                : !isFormValid ? '$ send_message() [DISABLED]'
                : '$ send_message()'}
            </button>
          </div>
        </form>

        {/* Socials */}
        <div className="section-animate flex flex-wrap gap-6 justify-center mt-8 font-mono text-[13px]">
          <a href={`mailto:${personalInfo.email}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-cyan transition-colors"><i className="bi bi-envelope-fill leading-none" /> {personalInfo.email}</a>
          <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-cyan transition-colors"><i className="bi bi-github leading-none" /> GitHub / AliveNata</a>
          <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-cyan transition-colors"><i className="bi bi-linkedin leading-none" /> LinkedIn / Alief Akbar</a>
        </div>
      </div>

      {/* Booking modal: pick a track, then Calendly. Uses theme-aware classes so it follows light/dark. */}
      {bookStep && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBookStep(null)}>
          <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            {bookStep === 'choose' ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-bold text-lg">How can I help?</h3>
                  <button onClick={() => setBookStep(null)} className="text-gray-500 hover:text-white" aria-label="Close"><i className="bi bi-x-lg leading-none" /></button>
                </div>
                <div className="space-y-3">
                  <button onClick={chooseOpenToWork} className="w-full text-left p-4 rounded-lg border border-surface-border hover:border-accent-cyan/50 hover:bg-accent-cyan/5 transition-all">
                    <div className="text-white font-semibold">Open to Work</div>
                    <div className="text-gray-400 text-[13px] mt-1">Hiring, freelance, or a project chat. Straight to the calendar.</div>
                  </button>
                  <button onClick={() => setBookStep('mentoring')} className="w-full text-left p-4 rounded-lg border border-surface-border hover:border-accent-cyan/50 hover:bg-accent-cyan/5 transition-all">
                    <div className="text-white font-semibold">Mentoring</div>
                    <div className="text-gray-400 text-[13px] mt-1">One-on-one guidance. Support is optional, no pressure.</div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold text-lg">Mentoring session</h3>
                  <button onClick={() => setBookStep(null)} className="text-gray-500 hover:text-white" aria-label="Close"><i className="bi bi-x-lg leading-none" /></button>
                </div>
                <p className="text-gray-400 text-[13.5px] leading-relaxed mb-5">Mentoring is free. If it helps, a small donation on SociaBuzz is a nice way to value the time, but it is completely optional. Pick a time whenever you are ready.</p>
                <a href={SOCIABUZZ_URL} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center py-3 rounded-lg font-semibold bg-gradient-to-r from-accent-cyan to-accent-blue text-primary hover:shadow-lg hover:shadow-accent-cyan/25 transition-all">
                  Support on SociaBuzz
                </a>
                <button onClick={mentoringContinue}
                  className="w-full mt-3 py-3 rounded-lg font-semibold border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10 hover:border-accent-cyan transition-all">
                  Continue to booking
                </button>
                <button onClick={() => setBookStep('choose')} className="w-full mt-3 text-gray-500 hover:text-white text-[13px]">Back</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send feedback toast. Driven by the existing `status`: enter/exit motion is the signal that
          the request finished (sent) or failed (error), so the result is not just a button-text change.
          The submit now reads a real result from /api/contact, so 'sent' means the message actually
          reached Alief and the copy can say so without hedging (PK-23). */}
      <AnimatePresence>
        {(status === 'sent' || status === 'error') && (
          <motion.div
            key={status}
            role={status === 'error' ? 'alert' : 'status'}
            aria-live={status === 'error' ? 'assertive' : 'polite'}
            // Transform + opacity only (no layout properties) so the animation stays off the main thread.
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
            animate={reduceMotion
              ? { opacity: 1, transition: { duration: 0.15 } }
              : { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 32 } }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, x: 16, transition: { duration: 0.18, ease: 'easeIn' } }}
            className="fixed z-[70] bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm"
          >
            {/* Shadow marks this as the one elevated overlay layer above the page content. */}
            <div className={`flex items-start gap-3 rounded-xl border bg-surface-card px-4 py-3.5 shadow-lg ${status === 'sent' ? 'border-accent-green/40' : 'border-red-500/40'}`}>
              <i className={`bi text-lg leading-none mt-0.5 ${status === 'sent' ? 'bi-check-circle-fill text-accent-green' : 'bi-exclamation-triangle-fill text-red-400'}`} />
              <div className="min-w-0 flex-1">
                <p className={`font-mono text-[13px] font-semibold ${status === 'sent' ? 'text-accent-green' : 'text-red-400'}`}>
                  {status === 'sent' ? 'Message sent' : "Couldn't send"}
                </p>
                <p className="text-gray-300 text-[12.5px] mt-0.5 leading-snug">
                  {status === 'sent' ? "It reached my inbox. I'll reply by email." : 'Something went wrong. Please try again.'}
                </p>
              </div>
              <button type="button" onClick={dismissToast} aria-label="Dismiss notification"
                className="shrink-0 -mr-1 -mt-0.5 rounded text-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan/40 transition-colors">
                <i className="bi bi-x-lg leading-none text-sm" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
