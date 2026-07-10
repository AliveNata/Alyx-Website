import { awards, certificates } from '../data/portfolio'

const sortedCertificates = [...certificates].sort((a, b) => Number(a.date) - Number(b.date))

export default function Recognition() {
  return (
    <section id="recognition" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-14">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">05</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>Recognition</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Awards */}
          <div className="section-animate">
            <h4 className="font-mono text-xs text-gray-600 tracking-widest uppercase mb-5">Awards</h4>
            {awards.map((a) => (
              <div key={a.id} className="flex gap-3.5 py-4.5 border-t border-surface-border first:border-t-0" style={{ paddingTop: 18, paddingBottom: 18 }}>
                <span className="text-xl shrink-0">{a.icon}</span>
                <div>
                  <div className="text-[15.5px] font-semibold text-white">{a.title}</div>
                  <div className="text-gray-400 text-[13px] mt-1 leading-relaxed">{a.description}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {a.metrics.map((m, i) => (
                      <span key={i} className="font-mono text-[10px] text-gray-600 border border-surface-border rounded px-[7px] py-0.5">{m.text}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Certificates */}
          <div className="section-animate">
            <h4 className="font-mono text-xs text-gray-600 tracking-widest uppercase mb-5">Certificates</h4>
            {sortedCertificates.map((c) => (
              <a
                key={c.id}
                href={c.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between gap-3.5 items-baseline py-4 border-t border-surface-border first:border-t-0 hover:pl-2 transition-all"
              >
                <div>
                  <div className="text-[15px] font-semibold text-white">{c.title}</div>
                  <div className="text-gray-400 text-[12.5px] mt-[3px] font-mono">{c.issuer}</div>
                </div>
                <span className="font-mono text-xs text-accent-cyan whitespace-nowrap">{c.date}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
