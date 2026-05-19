import { useState, useEffect } from 'react'
import { personalInfo } from '../data/portfolio'

// Base64 URL-safe encoding helpers
const b64url = (str) =>
  btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

// Simple hash function (DJB2) - for demo purposes, not cryptographic
function djb2(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & 0xffffffff
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// Generate JWT-like token (header.payload.signature)
function generateToken() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = b64url(JSON.stringify({
    sub: 'contact_form',
    iss: 'alivyx.dev',
    iat: now,
    exp: now + 600, // 10 minutes
    nonce: Math.random().toString(36).slice(2, 10),
  }))
  const signature = djb2(header + '.' + payload + '.alivyx_secret').slice(0, 12)
  return `${header}.${payload}.${signature}`
}

function verifyToken(token, originalToken) {
  if (!token || !originalToken) return false
  // Simple equality check (user has to paste the exact generated token)
  return token.trim() === originalToken.trim()
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '', token: '' })
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenStatus, setTokenStatus] = useState('idle') // 'idle' | 'valid' | 'invalid'
  const [status, setStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(15)

  // Generate initial token + auto-regenerate every 15 seconds
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

  // Verify token as user types
  useEffect(() => {
    if (!form.token) {
      setTokenStatus('idle')
    } else if (verifyToken(form.token, generatedToken)) {
      setTokenStatus('valid')
    } else {
      setTokenStatus('invalid')
    }
  }, [form.token, generatedToken])

  const isFormValid = form.name && form.email && form.message && tokenStatus === 'valid'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    const mailtoLink = `mailto:${personalInfo.email}?subject=Portfolio Contact from ${form.name}&body=${encodeURIComponent(form.message)}%0A%0AFrom: ${form.name} (${form.email})`
    window.open(mailtoLink)
    setStatus('sent')
    setTimeout(() => setStatus(null), 3000)
  }

  const regenerateToken = () => {
    setGeneratedToken(generateToken())
    setForm({ ...form, token: '' })
    setCopied(false)
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // ignore
    }
  }

  return (
    <section id="contact" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3">
            <span className="text-accent-cyan font-mono text-sm">05.</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Get In Touch</h2>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-4" />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact form */}
          <div className="section-animate">
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500" />
                <div className="terminal-dot bg-yellow-500" />
                <div className="terminal-dot bg-green-500" />
                <span className="ml-3 text-xs font-mono text-gray-500">send_message.sh</span>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">
                    <span className="text-accent-purple">const</span> name =
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">
                    <span className="text-accent-purple">const</span> email =
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-2">
                    <span className="text-accent-purple">const</span> message =
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell me about your project..."
                    className="w-full px-4 py-3 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all resize-none"
                  />
                </div>

                {/* JWT Token verification */}
                <div className="border-t border-surface-border pt-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-gray-500">
                      <span className="text-accent-purple">Authorization</span>: Bearer
                    </label>
                    <div className="flex items-center gap-2">
                      {tokenStatus === 'valid' && (
                        <span className="flex items-center gap-1 text-xs font-mono text-accent-green">
                          <i className="bi bi-check-circle-fill text-xs leading-none" />
                          Verified
                        </span>
                      )}
                      {tokenStatus === 'invalid' && (
                        <span className="flex items-center gap-1 text-xs font-mono text-red-400">
                          <i className="bi bi-x-circle-fill text-xs leading-none" />
                          Invalid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Token display box */}
                  <div className="bg-primary border border-surface-border rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-500">🔐 Your Access Token</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={copyToken}
                          className="px-2 py-0.5 text-xs font-mono text-accent-cyan hover:bg-accent-cyan/10 rounded transition-all"
                          title="Copy token"
                        >
                          {copied ? '✓ Copied' : '📋 Copy'}
                        </button>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-accent-purple bg-accent-purple/10 rounded"
                          title="Auto-regenerates every 15s"
                        >
                          <i className={`bi bi-arrow-repeat text-xs leading-none ${countdown <= 5 ? 'animate-spin' : ''}`} />
                          <span className={countdown <= 5 ? 'text-red-400' : ''}>{countdown}s</span>
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed break-all">
                      <span className="text-red-400">{generatedToken.split('.')[0]}</span>
                      <span className="text-gray-500">.</span>
                      <span className="text-accent-purple">{generatedToken.split('.')[1]}</span>
                      <span className="text-gray-500">.</span>
                      <span className="text-accent-cyan">{generatedToken.split('.')[2]}</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={form.token}
                    onChange={(e) => setForm({ ...form, token: e.target.value })}
                    placeholder="Paste the token above to unlock send button..."
                    className={`w-full px-4 py-3 bg-primary border rounded-lg text-white placeholder-gray-600 font-mono text-xs focus:outline-none focus:ring-1 transition-all ${
                      tokenStatus === 'valid'
                        ? 'border-accent-green/50 focus:border-accent-green focus:ring-accent-green/20'
                        : tokenStatus === 'invalid'
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-surface-border focus:border-accent-cyan/50 focus:ring-accent-cyan/20'
                    }`}
                  />
                  <p className="text-xs font-mono text-gray-600 mt-2">
                    {tokenStatus === 'valid'
                      ? '✓ Token verified. You can now send the message.'
                      : tokenStatus === 'invalid'
                      ? '✗ Token does not match. Please copy it exactly from above.'
                      : '// Copy the token above and paste it here to verify.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-3 font-medium rounded-lg font-mono text-sm transition-all duration-300 ${
                    isFormValid
                      ? 'bg-gradient-to-r from-accent-cyan to-accent-blue text-white hover:shadow-lg hover:shadow-accent-cyan/25 cursor-pointer'
                      : 'bg-surface-border text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {status === 'sent'
                    ? '✓ Message Sent!'
                    : !isFormValid
                    ? '🔒 $ send_message() [DISABLED]'
                    : '$ send_message()'}
                </button>
              </form>
            </div>
          </div>

          {/* Contact info */}
          <div className="section-animate space-y-6">
            <div className="bg-surface-card border border-surface-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Let's Build Something Together</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Looking for a Data Engineer or BI Analyst to help build scalable pipelines,
                automate workflows, or deliver actionable data insights? I'd love to hear about your project.
              </p>

              <div className="space-y-4">
                {/* Email */}
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="flex items-center gap-4 p-3 bg-primary/50 border border-surface-border rounded-lg hover:border-accent-cyan/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
                    <i className="bi bi-envelope-fill text-lg text-accent-cyan leading-none" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-gray-500">Email</div>
                    <div className="text-sm text-white group-hover:text-accent-cyan transition-colors">{personalInfo.email}</div>
                  </div>
                </a>

                {/* GitHub */}
                <a
                  href={personalInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 bg-primary/50 border border-surface-border rounded-lg hover:border-accent-purple/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center shrink-0">
                    <i className="bi bi-github text-lg text-accent-purple leading-none" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-gray-500">GitHub</div>
                    <div className="text-sm text-white group-hover:text-accent-purple transition-colors">AliveNata</div>
                  </div>
                </a>

                {/* LinkedIn */}
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 bg-primary/50 border border-surface-border rounded-lg hover:border-accent-blue/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
                    <i className="bi bi-linkedin text-lg text-accent-blue leading-none" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-gray-500">LinkedIn</div>
                    <div className="text-sm text-white group-hover:text-accent-blue transition-colors">Alief Akbar</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Availability card */}
            <div className="bg-surface-card border border-accent-green/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 bg-accent-green rounded-full animate-pulse" />
                <span className="text-sm font-mono text-accent-green">Currently Available</span>
              </div>
              <p className="text-sm text-gray-400">
                Open to full-time roles, freelance projects, and consulting
                in Data Engineering, Business Intelligence, and Analytics.
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
