import { personalInfo } from '../data/portfolio'

export default function Footer() {
  return (
    <footer className="py-6 border-t border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: inline npm install log */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-gray-500 bg-surface-card border border-surface-border rounded-md px-3 py-1.5">
            <span className="text-accent-green">$</span>
            <span className="text-gray-400">npm</span>
            <span className="text-accent-cyan">install</span>
            <span className="text-yellow-300">portfolio.workspace</span>
            <span className="npm-spinner text-accent-cyan ml-1" />
            <span className="text-accent-green ml-1">✓</span>
            <span className="text-gray-500">ready</span>
          </div>

          {/* Right: copyright */}
          <p className="text-xs font-mono text-gray-600 text-right">
            &copy; {new Date().getFullYear()} {personalInfo.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
