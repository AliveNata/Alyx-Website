import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { logCv, downloadManagedCv, submitCvLead, cvSessionId } from '../lib/cv'

// Gated page-1 CV viewer (PK-25). Shows the public page-1 PNG teaser; pages 2+
// live only in the tracked download. Honest by construction: it never claims the
// CV is "secure" or "protected" and shows no fabricated blurred pages, only a
// plain lock note that the rest is in the download (antislop R-36/R-38). Used by
// both the Navbar get_cv and the ChatBot get_cv action.
//
// Design Read: in-page modal CV teaser for recruiters, on the site's terminal
// ("$ get_cv") theme. Dial ENERGY 1 / RHYTHM 1 / MOTION 1 - hover states and a
// single fade on open, matching the rest of the portfolio; no decorative motion.

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim())

// en + id written; every other UI language falls back to en, matching the
// GREET/NOTICE/CV_COPY pattern elsewhere. ASCII only. Honest copy: the lock note
// states where the rest of the CV is, nothing about protection.
const COPY = {
  en: {
    title: 'get_cv',
    pageOf: (n) => `Page 1 of ${n}`,
    pageSingle: 'Page 1',
    lockHeading: 'Rest of the CV',
    lockOne: 'Page 2 is in the full CV. Download to read it.',
    lockMany: (n) => `Pages 2 to ${n} are in the full CV. Download to read them.`,
    download: 'Download full CV (PDF)',
    note: 'The download is the full PDF, pages and all.',
    close: 'Close',
    loading: 'Rendering page 1...',
    imgError: 'Could not load the preview. You can still download the full CV.',
    captureLead: 'Want Alief to follow up? Leave your email.',
    emailLabel: 'Your email',
    send: 'Send',
    cancel: 'No thanks',
    invalid: 'Enter a valid email.',
    error: 'Could not send. Please try again.',
    sent: 'Thanks. Alief will be in touch.',
  },
  id: {
    title: 'get_cv',
    pageOf: (n) => `Halaman 1 dari ${n}`,
    pageSingle: 'Halaman 1',
    lockHeading: 'Sisa CV',
    lockOne: 'Halaman 2 ada di CV lengkap. Unduh untuk membacanya.',
    lockMany: (n) => `Halaman 2 sampai ${n} ada di CV lengkap. Unduh untuk membacanya.`,
    download: 'Unduh CV lengkap (PDF)',
    note: 'Yang diunduh adalah PDF lengkap, semua halaman.',
    close: 'Tutup',
    loading: 'Menyiapkan halaman 1...',
    imgError: 'Preview gagal dimuat. Kamu tetap bisa mengunduh CV lengkap.',
    captureLead: 'Mau Alief follow up? Tinggalkan emailmu.',
    emailLabel: 'Email kamu',
    send: 'Kirim',
    cancel: 'Nggak dulu',
    invalid: 'Masukkan email yang valid.',
    error: 'Gagal mengirim. Coba lagi ya.',
    sent: 'Makasih. Alief bakal menghubungi kamu.',
  },
}

// Selector for the tabbable controls inside the dialog, for the focus trap.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function GatedCvViewer({ open, onClose, previewUrl, pages = 0, leadCapture = false, sessionId, lang = 'en' }) {
  const t = COPY[lang] || COPY.en
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const [imgState, setImgState] = useState('loading') // loading | ready | error
  // Capture: hidden until the admin toggle is on AND a download has fired.
  const [capture, setCapture] = useState({ open: false, email: '', hp: '', status: 'idle', done: '' })

  // Log a 'view' once each time the viewer opens, and reset per-open state.
  useEffect(() => {
    if (!open) return
    setImgState('loading')
    setCapture({ open: false, email: '', hp: '', status: 'idle', done: '' })
    logCv('view')
  }, [open, previewUrl])

  // Escape to close, focus the close button on open, and lock body scroll so the
  // page behind the modal does not move. A minimal focus trap keeps Tab inside.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab') return
      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || !nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const sid = sessionId || cvSessionId()

  const onDownload = () => {
    // The GET stream logs the 'download' row server-side, so the client must not
    // also beacon it (that would double-count). Just trigger the tracked stream.
    downloadManagedCv()
    if (leadCapture) setCapture((c) => ({ ...c, open: true }))
  }

  const onSubmitLead = async () => {
    const email = capture.email.trim()
    if (!isValidEmail(email)) { setCapture((c) => ({ ...c, status: 'invalid' })); return }
    setCapture((c) => ({ ...c, status: 'sending' }))
    const ok = await submitCvLead({ sessionId: sid, email, honeypot: capture.hp })
    if (ok) setCapture((c) => ({ ...c, open: false, email: '', hp: '', status: 'idle', done: t.sent }))
    else setCapture((c) => ({ ...c, status: 'error' }))
  }

  const lockNote = pages > 2 ? t.lockMany(pages) : t.lockOne

  // Portal to <body>: the Navbar (backdrop-filter) and ChatBot (transform) each
  // establish a containing block that would otherwise trap this fixed overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Curriculum Vitae preview"
        className="flex flex-col w-full max-w-3xl max-h-[92vh] rounded-xl border border-surface-border bg-surface-dark shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Header: terminal-style, matches the "$ get_cv" affordance that opens it. */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-surface-border bg-primary/60">
          <span className="font-mono text-xs text-gray-300 truncate">
            <span className="text-accent-cyan">$</span> {t.title}
            <span className="text-gray-400"> {' -- '} {pages > 1 ? t.pageOf(pages) : t.pageSingle}</span>
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="shrink-0 p-1.5 -mr-1 rounded text-gray-500 hover:text-accent-cyan transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
          >
            <i className="bi bi-x-lg text-base leading-none" aria-hidden="true" />
          </button>
        </div>

        {/* Page-1 image, scrollable when tall. Loading + error states (R-27). */}
        <div className="flex-1 overflow-y-auto bg-surface-card/40 px-3 py-3 sm:px-5 sm:py-5">
          {imgState === 'loading' && (
            <div className="flex items-center justify-center py-16 text-gray-400 font-mono text-xs">
              <i className="bi bi-arrow-repeat animate-spin mr-2" aria-hidden="true" /> {t.loading}
            </div>
          )}
          {imgState === 'error' ? (
            <div className="flex items-center justify-center py-16 text-gray-400 font-mono text-xs text-center px-6">
              {t.imgError}
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="CV, page 1"
              onLoad={() => setImgState('ready')}
              onError={() => setImgState('error')}
              className={`mx-auto w-full max-w-2xl rounded-md shadow-lg shadow-black/40 ${imgState === 'ready' ? 'block' : 'hidden'}`}
            />
          )}
        </div>

        {/* Footer: honest lock note (when >1 page) + the single download path, plus
            the optional, non-blocking email capture. */}
        <div className="border-t border-surface-border bg-primary/60 px-4 py-3.5 space-y-3">
          {pages > 1 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-surface-border bg-surface-card/50 px-3 py-2.5">
              <i className="bi bi-lock text-gray-500 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[13px] text-gray-200 font-medium">{t.lockHeading}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{lockNote}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-mono font-semibold rounded-lg bg-accent-cyan text-primary hover:shadow-lg hover:shadow-accent-cyan/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
            >
              <i className="bi bi-download" aria-hidden="true" /> {t.download}
            </button>
            <span className="text-gray-400 text-[11px] font-mono">{t.note}</span>
          </div>

          {capture.done && (
            <p className="text-[12px] font-mono text-accent-green flex items-center gap-1.5">
              <i className="bi bi-check-circle-fill" aria-hidden="true" /> {capture.done}
            </p>
          )}

          {capture.open && !capture.done && (
            <div className="rounded-lg border border-surface-border bg-surface-card/50 p-3 space-y-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-mono text-gray-400">{t.captureLead}</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-label={t.emailLabel}
                  value={capture.email}
                  onChange={(e) => setCapture((c) => ({ ...c, email: e.target.value, status: c.status === 'invalid' ? 'idle' : c.status }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmitLead() } }}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-surface-border bg-primary/70 text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                />
              </label>
              {/* Honeypot (P3-3 pattern): offscreen, out of tab order; the server
                  drops any filled value. */}
              <label style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                Leave this field blank
                <input
                  type="text"
                  name="contact_ref_x"
                  tabIndex={-1}
                  autoComplete="off"
                  value={capture.hp}
                  onChange={(e) => setCapture((c) => ({ ...c, hp: e.target.value }))}
                />
              </label>
              {capture.status === 'invalid' && <p className="text-[11px] font-mono text-red-400">{t.invalid}</p>}
              {capture.status === 'error' && <p className="text-[11px] font-mono text-red-400">{t.error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSubmitLead}
                  disabled={capture.status === 'sending'}
                  className="px-3 py-1.5 text-[12px] font-mono rounded-lg border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                >
                  {capture.status === 'sending' ? '...' : t.send}
                </button>
                <button
                  type="button"
                  onClick={() => setCapture((c) => ({ ...c, open: false, status: 'idle' }))}
                  className="px-3 py-1.5 text-[12px] font-mono rounded-lg text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
