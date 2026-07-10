import { personalInfo } from '../data/portfolio'

export default function Hero() {
  return (
    <section
      id="home"
      className="relative grid lg:grid-cols-[1.25fr_.75fr] items-center gap-5 min-h-screen px-6 sm:px-10 lg:px-16 max-w-[1200px] mx-auto pt-24 pb-14"
    >
      {/* Left: editorial name block */}
      <div className="relative z-20">
        {/* Kicker */}
        <div className="flex items-center gap-3 font-mono text-xs sm:text-[13px] text-gray-400 mb-8">
          <span className="inline-flex items-center gap-2 text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_10px_rgba(0,255,136,0.8)] animate-pulse" />
            available for work
          </span>
          <span className="flex-1 max-w-[150px] h-px bg-surface-border" />
        </div>

        {/* Giant name */}
        <h1
          className="font-black tracking-[-0.045em] text-white"
          style={{ lineHeight: 0.9, fontSize: 'clamp(62px,12vw,150px)' }}
        >
          {personalInfo.name.split(' ')[0]}
          <span
            className="hero-lastname block bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent"
            style={{ paddingBottom: '.08em', filter: 'drop-shadow(0 0 40px rgba(0,212,255,0.22))' }}
          >
            {personalInfo.name.split(' ')[1]}.
          </span>
        </h1>

        {/* Signature: role + meta */}
        <div className="mt-10 border-t border-surface-border pt-6 max-w-[52ch]">
          <p className="font-mono text-[13px] sm:text-[15.5px] text-gray-400">
            <span className="text-accent-green">$</span>{' '}
            <b className="text-white font-semibold">Data Engineer &amp; BI Analyst.</b>{' '}
            Building scalable pipelines, automating ETL, and the dashboards teams decide on.
          </p>
          <p className="font-mono text-xs text-gray-600 mt-3">7+ yrs · Jakarta</p>
        </div>
      </div>

      {/* Right: photo with fades */}
      <div className="hero-photo-col relative z-10 self-stretch overflow-hidden h-[82vh] hidden lg:block">
        <img
          src="/profile.jpg"
          alt={personalInfo.name}
          className="absolute inset-0 w-full h-full object-cover object-[center_12%]"
          style={{ filter: 'contrast(1.14) saturate(1.12) brightness(1.04)' }}
        />
        <div className="hero-fade-side absolute inset-0" />
        <div className="hero-fade-bottom absolute left-0 right-0 bottom-0 h-[28%]" />
      </div>

      {/* Mobile photo backdrop */}
      <div className="absolute inset-0 z-0 lg:hidden opacity-[0.22] overflow-hidden">
        <img
          src="/profile.jpg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-[center_12%]"
          style={{ filter: 'contrast(1.14) saturate(1.12) brightness(1.04)' }}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-6 lg:left-16 animate-bounce z-20">
        <i className="bi bi-arrow-down text-sm text-gray-600 leading-none" />
      </div>
    </section>
  )
}
