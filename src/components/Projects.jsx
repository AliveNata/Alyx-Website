import { useState } from 'react'
import { projects } from '../data/portfolio'

const categoryFilters = ['All', 'Data Engineering', 'BI & Analytics', 'Automation', 'Data Analysis', 'Other']

const categoryBadgeColors = {
  'Data Engineering': 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  'BI & Analytics': 'bg-accent-green/10 text-accent-green border-accent-green/20',
  'Automation': 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  'Data Analysis': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Other': 'bg-accent-purple/10 text-accent-purple border-accent-purple/20',
}

// Image-based cover with overlay
function ProjectCover({ project }) {
  return (
    <div className="absolute inset-0 bg-surface-dark">
      {project.image && (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
      )}
      {/* Gradient scrim for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent" />
    </div>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const [showAll, setShowAll] = useState(false)

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter)
  const displayed = showAll ? filtered : filtered.slice(0, 6)

  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3">
            <span className="text-accent-cyan font-mono text-sm">03.</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Projects</h2>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-4" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="section-animate flex flex-wrap gap-2 mb-10">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => { setFilter(cat); setShowAll(false); }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                filter === cat
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                  : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {displayed.map((project) => (
            <div
              key={project.title}
              className="relative bg-surface-card border border-surface-border rounded-xl overflow-hidden card-glow group h-full"
            >
              {/* Image cover with action buttons */}
              <div className="relative h-48 overflow-hidden">
                <ProjectCover project={project} />
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all inline-flex"
                      aria-label="View on GitHub"
                      onClick={e => e.stopPropagation()}
                    >
                      <i className="bi bi-github text-sm leading-none" />
                    </a>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-accent-cyan/80 backdrop-blur-md rounded-full text-white hover:bg-accent-cyan transition-all inline-flex"
                      aria-label="Open live site"
                      onClick={e => e.stopPropagation()}
                    >
                      <i className="bi bi-box-arrow-up-right text-sm leading-none" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-accent-cyan transition-colors">
                    {project.title}
                  </h3>
                </div>
                <span className={`inline-block text-xs font-mono px-2 py-0.5 rounded-full border ${categoryBadgeColors[project.category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'} mb-3`}>
                  {project.category}
                </span>

                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 bg-primary/50 border border-surface-border rounded text-xs font-mono text-gray-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more */}
        {filtered.length > 6 && !showAll && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="px-6 py-2 border border-accent-cyan/30 text-accent-cyan font-mono text-sm rounded-lg hover:bg-accent-cyan/10 transition-all"
            >
              Show More Projects
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
