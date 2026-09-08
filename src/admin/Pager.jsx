export const PAGE_SIZE = 10

// Truncated pagination range (MUI-style): boundaryCount pages at each end,
// siblingCount pages around the current page, ellipsis for the gaps.
// e.g. [1, '...', 4, 5, 6, 7, 8, '...', 20]
function range(start, end) {
  const out = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

export function paginationItems(current, total, boundary = 1, sibling = 2) {
  if (total <= 1) return [1]
  const startPages = range(1, Math.min(boundary, total))
  const endPages = range(Math.max(total - boundary + 1, boundary + 1), total)

  const siblingsStart = Math.max(
    Math.min(current - sibling, total - boundary - sibling * 2 - 1),
    boundary + 2,
  )
  const siblingsEnd = Math.min(
    Math.max(current + sibling, boundary + sibling * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : total - 1,
  )

  return [
    ...startPages,
    ...(siblingsStart > boundary + 2
      ? ['ellipsis-start']
      : boundary + 1 < total - boundary ? [boundary + 1] : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < total - boundary - 1
      ? ['ellipsis-end']
      : total - boundary > boundary ? [total - boundary] : []),
    ...endPages,
  ]
}

const btn = 'min-w-[34px] h-[34px] px-2 grid place-items-center rounded-lg border text-sm font-mono transition-all'

export function Pager({ page, total, onChange }) {
  if (total <= 1) return null
  const items = paginationItems(page, total)
  return (
    <div className="flex items-center justify-end gap-1.5 mt-5">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`${btn} border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 disabled:opacity-30 disabled:pointer-events-none`} aria-label="Previous">
        <i className="bi bi-chevron-left" />
      </button>
      {items.map((it, i) =>
        typeof it === 'string'
          ? <span key={it + i} className="min-w-[34px] h-[34px] grid place-items-center text-gray-600 font-mono">...</span>
          : <button key={it} onClick={() => onChange(it)}
              className={`${btn} ${it === page ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan' : 'border-surface-border text-gray-400 hover:text-white hover:border-gray-600'}`}>
              {it}
            </button>,
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        className={`${btn} border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 disabled:opacity-30 disabled:pointer-events-none`} aria-label="Next">
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  )
}
