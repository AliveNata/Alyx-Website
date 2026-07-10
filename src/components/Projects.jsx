import { useState } from 'react'
import { projects } from '../data/portfolio'

const categoryFilters = ['All', 'Data Engineering', 'BI & Analytics', 'Automation', 'Data Analysis', 'Other']

function ProjectLinks({ project }) {
  return (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
      {project.github && (
        <a href={project.github} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all inline-flex" aria-label="GitHub">
          <i className="bi bi-github text-sm leading-none" />
        </a>
      )}
      {project.link && (
        <a href={project.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="p-2 bg-accent-cyan/80 backdrop-blur-md rounded-full text-white hover:bg-accent-cyan transition-all inline-flex" aria-label="Live site">
          <i className="bi bi-box-arrow-up-right text-sm leading-none" />
        </a>
      )}
    </div>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const [showAll, setShowAll] = useState(false)

  const filtered = filter === 'All' ? projects : projects.filter((p) => p.category === filter)
  const displayed = showAll ? filtered : filtered.slice(0, 7)

  return (
    <section id="projects" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-5">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">04</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>Selected work</h2>
        </div>
        <p className="section-animate font-mono text-[12.5px] text-gray-600 ml-[39px] mb-11">// pipelines, dashboards, automation &amp; full-stack builds</p>

        {/* Filter tabs */}
        <div className="section-animate flex flex-wrap gap-1 mb-8">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => { setFilter(cat); setShowAll(false) }}
              className={`font-mono text-xs px-3.5 py-2 rounded-lg border transition-all ${
                filter === cat ? 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10' : 'text-gray-400 border-surface-border hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Varied grid */}
        <div className="grid md:grid-cols-2 gap-4.5" style={{ gap: 18 }}>
          {displayed.map((project, i) => {
            const hero = i === 0
            return (
              <article
                key={project.title}
                className={`group border border-surface-border rounded-[3px] overflow-hidden bg-surface-card hover:border-accent-cyan/30 hover:-translate-y-0.5 transition-all flex ${
                  hero ? 'md:col-span-2 flex-col md:flex-row' : 'flex-col'
                }`}
              >
                <div className={`relative overflow-hidden bg-surface-dark ${hero ? 'md:w-[52%] aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}`}>
                  <span className="absolute top-3 left-3 z-10 font-mono text-[10px] px-[9px] py-1 bg-primary/80 backdrop-blur-sm border border-surface-border rounded-[5px] text-accent-cyan">{project.category}</span>
                  <ProjectLinks project={project} />
                  {project.image && (
                    <img src={project.image} alt={project.title} loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500" />
                  )}
                </div>
                <div className={`flex-1 flex flex-col ${hero ? 'p-8 justify-center' : 'p-5'}`}>
                  <h3 className={`font-bold tracking-tight text-white ${hero ? 'text-2xl sm:text-3xl mb-2.5' : 'text-lg mb-2'}`}>{project.title}</h3>
                  <p className="text-gray-400 text-[13.5px] leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-4">
                    {project.tech.map((t) => (
                      <span key={t} className="font-mono text-[10px] px-2 py-[3px] border border-surface-border rounded text-gray-400">{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {filtered.length > 7 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="section-animate mt-6 w-full font-mono text-[12.5px] text-accent-cyan border border-dashed border-accent-cyan/35 rounded-lg py-3 hover:bg-accent-cyan/5 transition-all"
          >
            {showAll ? '$ show_less()' : `$ show_more() // +${filtered.length - 7}`}
          </button>
        )}
      </div>
    </section>
  )
}
