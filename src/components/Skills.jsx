import { useState } from 'react'
import * as simpleIcons from 'simple-icons'
import { skills } from '../data/portfolio'

const categoryColors = {
  "Data Engineering": { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan', bar: 'bg-accent-cyan', border: 'border-accent-cyan/20' },
  "BI & Visualization": { bg: 'bg-accent-green/10', text: 'text-accent-green', bar: 'bg-accent-green', border: 'border-accent-green/20' },
  "Web Development": { bg: 'bg-accent-purple/10', text: 'text-accent-purple', bar: 'bg-accent-purple', border: 'border-accent-blue/20' },
  "DevOps & Tools": { bg: 'bg-accent-blue/10', text: 'text-accent-blue', bar: 'bg-accent-blue', border: 'border-accent-blue/20' },
}

// Renders the right icon based on prefix convention in icon string
function SkillIcon({ icon, name }) {
  // devicon font icon
  if (icon.startsWith('devicon-')) {
    return <i className={`${icon} text-xl leading-none shrink-0`} />
  }
  // simple-icons inline SVG: "si:siKeyName" or "si:siKeyName:#overrideColor"
  if (icon.startsWith('si:')) {
    const [, key, colorOverride] = icon.split(':')
    const si = simpleIcons[key]
    if (si) {
      const fill = colorOverride || `#${si.hex}`
      return (
        <svg
          role="img"
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill={fill}
          className="shrink-0"
          dangerouslySetInnerHTML={{ __html: si.path }}
        />
      )
    }
  }
  // local SVG file in public/icons/
  if (icon.startsWith('/icons/')) {
    return <img src={icon} alt={name} width={20} height={20} className="w-5 h-5 shrink-0 object-contain" />
  }
  // Bootstrap icon with brand color: "bi:icon-name:#hexcolor"
  if (icon.startsWith('bi:')) {
    const [, biName, color] = icon.split(':')
    return <i className={`bi bi-${biName} text-xl leading-none shrink-0`} style={{ color }} />
  }
  // emoji fallback
  return <span className="text-lg shrink-0">{icon}</span>
}

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState(Object.keys(skills)[0])
  const categories = Object.keys(skills)

  return (
    <section id="skills" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="section-animate mb-12">
          <div className="flex items-center gap-3">
            <span className="text-accent-cyan font-mono text-sm">02.</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Tech Stack</h2>
            <div className="hidden sm:block flex-1 h-px bg-surface-border ml-4" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="section-animate flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => {
            const colors = categoryColors[cat]
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-300 ${
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {skills[activeCategory].map((skill) => (
            <div
              key={skill.name}
              className="bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 card-glow flex items-center gap-2"
            >
              <SkillIcon icon={skill.icon} name={skill.name} />
              <h3 className="text-xs font-semibold text-white truncate">{skill.name}</h3>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
