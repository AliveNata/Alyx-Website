import { useState, useEffect } from 'react'
import { personalInfo } from '../data/portfolio'

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

// Google Apps Script Web App endpoint that appends to the "Contact Me" sheet tab
const SHEET_ENDPOINT = import.meta.env.VITE_CONTACT_SHEET_URL || ''

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '', token: '' })
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenStatus, setTokenStatus] = useState('idle')
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(15)

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

  const isFormValid = form.name && form.email && form.message && tokenStatus === 'valid'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid || status === 'sending') return
    if (!SHEET_ENDPOINT) { setStatus('error'); setTimeout(() => setStatus(null), 4000); return }
    setStatus('sending')
    try {
      await fetch(SHEET_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ name: form.name, email: form.email, message: form.message }),
      })
      setStatus('sent')
      setForm({ name: '', email: '', message: '', token: '' })
      setTimeout(() => setStatus(null), 4000)
    } catch (err) {
      setStatus('error')
      setTimeout(() => setStatus(null), 4000)
    }
  }

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

            {/* send */}
            <button type="submit" disabled={!isFormValid || status === 'sending'}
              className={`sm:col-span-2 w-full py-3 font-mono text-sm font-bold rounded-lg transition-all ${
                isFormValid ? 'bg-gradient-to-r from-accent-cyan to-accent-blue text-primary cursor-pointer hover:shadow-lg hover:shadow-accent-cyan/25' : 'bg-surface-border text-gray-500 cursor-not-allowed opacity-60'
              }`}>
              {status === 'sending' ? '$ sending...'
                : status === 'sent' ? '✓ Message Sent!'
                : status === 'error' ? '✗ Failed, try again'
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
    </section>
  )
}
