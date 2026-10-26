import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../lib/apiBase'
import { fetchCvSettings, viewCv, downloadCv, logCv, STATIC_CV_URL } from '../lib/cv'
import GatedCvViewer from './GatedCvViewer'

const navLinks = [
  { name: 'home', href: '#home', ext: '.sql' },
  { name: 'about', href: '#about', ext: '.md' },
  { name: 'skills', href: '#skills', ext: '.json' },
  { name: 'experience', href: '#experience', ext: '.log' },
  { name: 'projects', href: '#projects', ext: '.py' },
  { name: 'recognition', href: '#recognition', ext: '.md' },
  { name: 'contact', href: '#contact', ext: '.sh' },
]


const THEMES = ['code', 'dark', 'light']
const THEME_ICONS = {
  code: <i className="bi bi-code-slash text-sm leading-none" />,
  dark: <i className="bi bi-moon-fill text-sm leading-none" />,
  light: <i className="bi bi-sun-fill text-sm leading-none" />,
}

// Existing Telegram ping on download (kept for no regression). The hashed
// view/download log (PK-18) is separate and fired via logCv.
const notifyDownload = () => {
  fetch(`${API_BASE}/api/cv-notify`, { method: 'POST' }).catch(() => {})
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('alivyx-theme') || 'code')
  // Managed CV (PK-18 + PK-25). Starts on the static fallback so get_cv works
  // before the settings load resolves (or if it fails). When a gated CV exists
  // (previewUrl set) the $ get_cv button opens the page-1 viewer; otherwise it
  // falls back to the PK-18 popover (view in a tab + direct download).
  const [cv, setCv] = useState({ cvUrl: STATIC_CV_URL, previewUrl: '', pages: 0, leadCapture: false })
  const [cvMenuOpen, setCvMenuOpen] = useState(false)
  const [cvViewerOpen, setCvViewerOpen] = useState(false)
  const cvMenuRef = useRef(null)
  const gated = !!cv.previewUrl

  useEffect(() => { fetchCvSettings().then(setCv) }, [])

  // Close the desktop CV popover on an outside click or Escape.
  useEffect(() => {
    if (!cvMenuOpen) return
    const onDown = (e) => { if (cvMenuRef.current && !cvMenuRef.current.contains(e.target)) setCvMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setCvMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [cvMenuOpen])

  // Fallback (un-migrated CV): view opens the managed/static PDF in a tab, download
  // forces a save. Both still log a hashed signal (PK-18).
  const handleViewCv = () => { logCv('view'); viewCv(cv.cvUrl); setCvMenuOpen(false); setMobileOpen(false) }
  const handleDownloadCv = () => { logCv('download'); downloadCv(cv.cvUrl); notifyDownload(); setCvMenuOpen(false); setMobileOpen(false) }
  // Gated path (PK-25): open the page-1 viewer instead of handing over the PDF.
  const openCvViewer = () => { setCvViewerOpen(true); setCvMenuOpen(false); setMobileOpen(false) }

  useEffect(() => {
    document.body.classList.remove('theme-code', 'theme-dark', 'theme-light')
    document.body.classList.add(`theme-${theme}`)
    localStorage.setItem('alivyx-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)

      const sections = navLinks.map(l => l.href.slice(1))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-primary/95 backdrop-blur-md shadow-lg shadow-black/30' : 'bg-primary/80 backdrop-blur-sm'
    }`}>
      {/* Tab strip */}
      <div className="bg-primary/95 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2">
            {/* Spacer pushes tabs to the right */}
            <div className="flex-1" />

            {/* Desktop tabs - compact, right-aligned */}
            <div className="hidden md:flex items-end overflow-x-auto scrollbar-hide">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.slice(1)
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono whitespace-nowrap transition-all border-r border-surface-border ${
                      isActive
                        ? 'bg-surface-card text-accent-cyan border-t border-t-accent-cyan -mb-px'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/5 border-t border-t-transparent'
                    }`}
                  >
                    <span>{link.name}</span>
                  </a>
                )
              })}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length])}
              title={`Theme: ${theme}`}
              className="p-1.5 text-gray-500 hover:text-accent-cyan transition-colors shrink-0"
            >
              {THEME_ICONS[theme]}
            </button>

            {/* get_cv - desktop only. Gated (PK-25): the button opens the page-1
                viewer. Fallback (PK-18): a popover with view-in-a-tab + download. */}
            <div ref={cvMenuRef} className="hidden md:block relative shrink-0">
              <button
                onClick={() => (gated ? openCvViewer() : setCvMenuOpen((o) => !o))}
                aria-haspopup={gated ? undefined : 'true'}
                aria-expanded={gated ? undefined : cvMenuOpen}
                className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
              >
                $ get_cv
              </button>
              {!gated && cvMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-md border border-surface-border bg-surface-dark/95 backdrop-blur-sm shadow-lg shadow-black/40 py-1 z-50">
                  <button
                    onClick={handleViewCv}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono text-gray-300 hover:text-accent-cyan hover:bg-white/5 transition-colors focus:outline-none focus-visible:bg-white/5"
                  >
                    <i className="bi bi-eye text-sm leading-none" /> View CV
                  </button>
                  <button
                    onClick={handleDownloadCv}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono text-gray-300 hover:text-accent-cyan hover:bg-white/5 transition-colors focus:outline-none focus-visible:bg-white/5"
                  >
                    <i className="bi bi-download text-sm leading-none" /> Download
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden ml-auto text-gray-400 hover:text-accent-cyan p-2"
            >
              <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'} text-xl leading-none`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-dark/95 backdrop-blur-lg border-b border-surface-border">
          {/* get_cv (PK-18 + PK-25). Gated: one button opens the page-1 viewer.
              Fallback: view-in-a-tab + direct download. */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-1 px-2 pt-1 text-[11px] font-mono text-gray-500">$ get_cv</div>
            <div className="flex gap-2 mt-1.5">
              {gated ? (
                <button
                  onClick={openCvViewer}
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-sm font-mono font-semibold rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                >
                  <i className="bi bi-eye text-xs leading-none" /> View CV
                </button>
              ) : (
                <>
                  <button
                    onClick={handleViewCv}
                    className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-sm font-mono font-semibold rounded-lg bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                  >
                    <i className="bi bi-eye text-xs leading-none" /> View
                  </button>
                  <button
                    onClick={handleDownloadCv}
                    className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-sm font-mono font-semibold rounded-lg bg-accent-cyan text-primary hover:opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                  >
                    <i className="bi bi-download text-xs leading-none" /> Download
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mx-3 h-px bg-surface-border mb-1" />
          <div className="px-2 py-2 space-y-0.5">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1)
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-mono rounded-md transition-all ${
                    isActive
                      ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan'
                      : 'text-gray-400 hover:text-accent-cyan border-l-2 border-transparent'
                  }`}
                >
                  <span>{link.name}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Gated page-1 CV viewer (PK-25). Mounted once; renders only when open. */}
      <GatedCvViewer
        open={cvViewerOpen}
        onClose={() => setCvViewerOpen(false)}
        previewUrl={cv.previewUrl}
        pages={cv.pages}
        leadCapture={cv.leadCapture}
      />
    </nav>
  )
}
