import { useState, useEffect } from 'react'

const navLinks = [
  { name: 'home', href: '#home', ext: '.sql' },
  { name: 'about', href: '#about', ext: '.md' },
  { name: 'skills', href: '#skills', ext: '.json' },
  { name: 'projects', href: '#projects', ext: '.py' },
  { name: 'experience', href: '#experience', ext: '.log' },
  { name: 'contact', href: '#contact', ext: '.sh' },
]


const THEMES = ['code', 'dark', 'light']
const THEME_ICONS = {
  code: <i className="bi bi-code-slash text-sm leading-none" />,
  dark: <i className="bi bi-moon-fill text-sm leading-none" />,
  light: <i className="bi bi-sun-fill text-sm leading-none" />,
}

const notifyDownload = () => {
  fetch('/.netlify/functions/cv-notify', { method: 'POST' }).catch(() => {})
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('alivyx-theme') || 'code')

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
                    <i className={`bi bi-file-earmark-code text-xs leading-none ${isActive ? 'text-accent-cyan' : 'text-gray-600'}`} />
                    <span>{link.name}</span>
                    <span className="text-gray-700">{link.ext}</span>
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

            {/* Hire Me CTA — desktop only */}
            <a
              href="/Curriculum%20Vitae%20-%20Alief%20Akbar.pdf"
              download="Curriculum Vitae - Alief Akbar.pdf"
              onClick={notifyDownload}
              className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-medium rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/20 transition-all shrink-0"
            >
              $ get_cv
            </a>

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
          {/* Featured CTA */}
          <div className="px-3 pt-3 pb-2">
            <a
              href="/Curriculum%20Vitae%20-%20Alief%20Akbar.pdf"
              download="Curriculum Vitae - Alief Akbar.pdf"
              onClick={() => { notifyDownload(); setMobileOpen(false) }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-mono font-semibold rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue text-primary hover:opacity-90 transition-all"
            >
              $ get_cv
              <i className="bi bi-download text-xs leading-none" />
            </a>
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
                  <i className="bi bi-file-earmark-code text-xs leading-none" />
                  <span>{link.name}</span>
                  <span className="text-xs text-gray-600">{link.ext}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
