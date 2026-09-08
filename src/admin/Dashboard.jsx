import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './auth'

const NAV = [
  { to: '/admin', end: true, icon: 'bi-person-badge', label: 'Personal' },
  { to: '/admin/skills', icon: 'bi-stack', label: 'Skills' },
  { to: '/admin/projects', icon: 'bi-kanban', label: 'Projects' },
  { to: '/admin/experiences', icon: 'bi-briefcase', label: 'Experience' },
  { to: '/admin/awards', icon: 'bi-award', label: 'Awards' },
  { to: '/admin/certificates', icon: 'bi-patch-check', label: 'Certificates' },
  { to: '/admin/chatbot', icon: 'bi-robot', label: 'Chatbot' },
  { to: '/admin/changelog', icon: 'bi-clock-history', label: 'Changelog' },
  { to: '/admin/github', icon: 'bi-github', label: 'GitHub' },
  { to: '/admin/settings', icon: 'bi-sliders', label: 'Settings' },
]

export default function Dashboard() {
  const { email, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-primary text-gray-200">
      <div className="flex min-h-screen">
      {/* Sidebar — height follows content (buttons sit at the content's bottom, not pinned to the viewport) */}
      <aside className="w-56 shrink-0 border-r border-surface-border bg-surface-dark flex flex-col">
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-5 h-5" />
            <span className="font-bold text-white">Alyx Admin</span>
          </div>
          <p className="text-[10px] font-mono text-gray-600 mt-1 truncate">{email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-mono transition-all ${isActive ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-gray-400 hover:text-white hover:bg-surface-card'}`}>
              <i className={`bi ${n.icon}`} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-border space-y-1">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-mono text-gray-400 hover:text-white hover:bg-surface-card transition-all">
            <i className="bi bi-box-arrow-up-right" /> View site
          </a>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-mono text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <i className="bi bi-box-arrow-left" /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 max-w-5xl">
        <Outlet />
      </main>
      </div>
    </div>
  )
}
