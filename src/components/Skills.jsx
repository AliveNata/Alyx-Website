import { useState } from 'react'
import * as simpleIcons from 'simple-icons'
import { skills } from '../data/portfolio'

function SkillIcon({ icon, name, size = 20 }) {
  if (icon.startsWith('devicon-')) {
    return <i className={`${icon} leading-none shrink-0`} style={{ fontSize: size }} />
  }
  if (icon.startsWith('si:')) {
    const [, key, colorOverride] = icon.split(':')
    const si = simpleIcons[key]
    if (si) {
      const fill = colorOverride || `#${si.hex}`
      return <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill={fill} className="shrink-0" dangerouslySetInnerHTML={{ __html: si.path }} />
    }
  }
  if (icon.startsWith('/icons/')) {
    return <img src={icon} alt={name} width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />
  }
  if (icon.startsWith('bi:')) {
    const [, biName, color] = icon.split(':')
    return <i className={`bi bi-${biName} leading-none shrink-0`} style={{ color, fontSize: size }} />
  }
  return <span className="shrink-0" style={{ fontSize: size * 0.9 }}>{icon}</span>
}

// Honest qualitative tier instead of a fake percentage
const tierOf = (lvl) =>
  lvl >= 85 ? { label: 'core', cls: 'text-accent-green', dot: 'bg-accent-green' }
  : lvl >= 78 ? { label: 'proficient', cls: 'text-accent-cyan', dot: 'bg-accent-cyan' }
  : { label: 'familiar', cls: 'text-gray-500', dot: 'bg-gray-600' }

const featCopy = {
  'Data Engineering': 'the backbone of every pipeline, transform, and automation I ship.',
  'BI & Visualization': 'dashboards regional teams open every morning to make the call.',
  'Web Development': 'full-stack builds, React front, Node back, shipped to real clients.',
  'DevOps & Tools': 'the daily driver for exploration, modeling, and analysis.',
}

export default function Skills() {
  const categories = Object.keys(skills)
  const [activeCategory, setActiveCategory] = useState(categories[0])

  const items = [...skills[activeCategory]].sort((a, b) => b.level - a.level)
  const top = items[0]
  const topTier = tierOf(top.level)

  return (
    <section id="skills" className="py-24 sm:py-28 border-t border-surface-border">
      <div className="max-w-[1160px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="section-animate grid grid-cols-[auto_1fr] gap-6 items-baseline mb-5">
          <span className="font-mono text-[13px] text-accent-cyan pt-2">02</span>
          <h2 className="font-extrabold tracking-[-0.03em] text-white leading-tight" style={{ fontSize: 'clamp(28px,4.2vw,50px)' }}>Stack</h2>
        </div>
        <p className="section-animate font-mono text-[12.5px] text-gray-600 ml-[39px] mb-11">// the tools I actually reach for &middot; switch category</p>

        {/* Tabs */}
        <div className="section-animate flex flex-wrap gap-1 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-mono text-xs px-3.5 py-2 rounded-lg border transition-all ${
                activeCategory === cat
                  ? 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10'
                  : 'text-gray-400 border-surface-border hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured + logo grid */}
        <div className="grid lg:grid-cols-[1fr_1.7fr] gap-8 lg:gap-16 items-start">
          <div className="section-animate border border-surface-border rounded-[3px] p-6 bg-surface-card">
            <div className="w-[52px] h-[52px] mb-4 flex items-center"><SkillIcon icon={top.icon} name={top.name} size={48} /></div>
            <div className="font-mono text-[11px] text-accent-cyan tracking-widest">most_used</div>
            <div className="font-black tracking-[-0.03em] mt-1.5 text-white leading-none" style={{ fontSize: 'clamp(30px,4vw,44px)' }}>{top.name}</div>
            <div className={`inline-flex items-center gap-1.5 mt-3 font-mono text-[11px] ${topTier.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${topTier.dot}`} />{topTier.label}
            </div>
            <p className="text-gray-400 text-sm mt-4">{featCopy[activeCategory]}</p>
          </div>

          <div className="section-animate grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(84px,1fr))' }}>
            {items.map((s) => {
              const t = tierOf(s.level)
              return (
                <div key={s.name} title={t.label} className="border border-surface-border rounded-[9px] p-3 flex flex-col items-center gap-1.5 bg-surface-card hover:-translate-y-0.5 hover:border-accent-cyan/30 transition-all">
                  <div className="h-7 flex items-center"><SkillIcon icon={s.icon} name={s.name} size={27} /></div>
                  <span className="text-[11px] font-semibold text-center text-white leading-tight">{s.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Tier legend */}
        <div className="section-animate flex flex-wrap gap-4 mt-8 font-mono text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent-green" /> core</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" /> proficient</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-600" /> familiar</span>
        </div>
      </div>
    </section>
  )
}
