import { useState, useEffect, useRef } from 'react'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import ChatBot from './components/ChatBot'
import Footer from './components/Footer'

function App() {
  const [preloaderDone, setPreloaderDone] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const [footerHeight, setFooterHeight] = useState(80)
  // track previous footerVisible to trigger glitter only on change
  const prevFooterVisible = useRef(false)
  const [closeBtnKey, setCloseBtnKey] = useState(0)
  const footerRef = useRef(null)

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.section-animate').forEach((el) => {
      sectionObserver.observe(el)
    })
    return () => sectionObserver.disconnect()
  }, [])

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return
    setFooterHeight(footer.offsetHeight + 16)
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting
        if (nowVisible !== prevFooterVisible.current) {
          prevFooterVisible.current = nowVisible
          setFooterVisible(nowVisible)
          // bump key to retrigger glitter-in animation
          setCloseBtnKey(k => k + 1)
        }
      },
      { threshold: 0 }
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  // When chat opens/closes, also retrigger glitter
  const handleToggleChat = () => {
    setShowChat(v => !v)
    setCloseBtnKey(k => k + 1)
  }

  // pill shows: always "Ask Alyx AI" OR "Close" (only when chat open + NOT at footer)
  const showClosePill = showChat && !footerVisible

  return (
    <>
    <Preloader onDone={() => setPreloaderDone(true)} />
    <div
      className="min-h-screen bg-primary relative"
      style={{
        opacity: preloaderDone ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >

      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <Footer />

      {/* Chat pill button */}
      <button
        onClick={handleToggleChat}
        className="fixed right-6 z-50 transition-all duration-300"
        style={{ bottom: footerVisible ? `${footerHeight}px` : '24px' }}
        aria-label="Toggle AI Chat"
      >
        {showClosePill ? (
          /* Close button — visible when chat open + not at footer */
          <div key={`close-${closeBtnKey}`} className="glitter-in relative rounded-full border border-white/30 bg-white/10 px-3 py-1.5 flex items-center gap-1.5 hover:bg-white/15 hover:scale-105 transition-all duration-200">
            <i className="bi bi-x-lg text-xs text-white leading-none" />
            <span className="text-xs font-mono font-medium text-white">Close</span>
          </div>
        ) : !showChat ? (
          /* Ask Alyx AI — default */
          <div className="neon-pulse relative rounded-full border border-accent-cyan/30 bg-accent-cyan/8 px-3 py-1.5 flex items-center gap-1.5 hover:bg-accent-cyan/15 hover:scale-105 transition-all duration-200">
            <i className="bi bi-chat-dots-fill text-xs text-accent-cyan leading-none" />
            <span className="text-xs font-mono font-medium text-accent-cyan">Ask Alyx AI</span>
          </div>
        ) : null /* chat open + at footer → pill hidden, X is in chatbox header */}
      </button>

      {showChat && (
        <ChatBot
          onClose={() => { setShowChat(false); setCloseBtnKey(k => k + 1) }}
          showHeaderClose={footerVisible}
        />
      )}
    </div>
    </>
  )
}

export default App
