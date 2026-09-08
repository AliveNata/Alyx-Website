// Declarative config per resource - drives both the list table and the editor
// form in ResourceManager, so there is one component instead of six pages.

const joinTags = (v) => Array.isArray(v) ? v.join(', ') : ''

const PROJECT_CATEGORIES = ['Data Engineering', 'BI & Analytics', 'Automation', 'Data Analysis', 'Other']
const WORK_TYPES = ['Onsite', 'Hybrid', 'Remote']
const EXP_TYPES = [
  { value: 'it', label: 'IT' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'nonit', label: 'Non-IT' },
]

export const CONFIGS = {
  skills: {
    endpoint: '/api/skills',
    title: 'Skills',
    icon: 'bi-stack',
    newLabel: 'skill',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'level', label: 'Level' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Data Engineering' },
      { name: 'icon', label: 'Icon', type: 'icon' },
      { name: 'level', label: 'Level (0-100)', type: 'number', placeholder: '80' },
    ],
  },
  projects: {
    endpoint: '/api/projects',
    title: 'Projects',
    icon: 'bi-kanban',
    newLabel: 'project',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'tech', label: 'Tech', render: joinTags },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: PROJECT_CATEGORIES.map((c) => ({ value: c, label: c })) },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'tech', label: 'Tech Stack', type: 'tags' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'github', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/...' },
      { name: 'link', label: 'Live URL', type: 'text', placeholder: 'https://...' },
    ],
  },
  experiences: {
    endpoint: '/api/experiences',
    title: 'Experience',
    icon: 'bi-briefcase',
    newLabel: 'experience',
    columns: [
      { key: 'role', label: 'Role' },
      { key: 'company', label: 'Company' },
      { key: 'period', label: 'Period' },
      { key: 'exp_type', label: 'Type', render: (v) => EXP_TYPES.find((t) => t.value === v)?.label || v },
    ],
    fields: [
      { name: 'exp_type', label: 'Type', type: 'select', options: EXP_TYPES },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'period', label: 'Period', type: 'text', placeholder: 'Mar 2026 - Present' },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: '1 yr 6 mos (optional)' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'work_type', label: 'Work Type', type: 'select', options: [{ value: '', label: '-' }, ...WORK_TYPES.map((w) => ({ value: w, label: w }))] },
      { name: 'description', label: 'Description (bullets)', type: 'lines' },
      { name: 'technologies', label: 'Technologies', type: 'tags' },
      { name: 'projects', label: 'Projects (freelance)', type: 'tags' },
      { name: 'highlight', label: 'Highlight (freelance)', type: 'highlight' },
    ],
  },
  awards: {
    endpoint: '/api/awards',
    title: 'Awards',
    icon: 'bi-award',
    newLabel: 'award',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'icon', label: 'Icon (emoji)', type: 'text', placeholder: '🎖️' },
      { name: 'metrics', label: 'Metrics', type: 'metrics' },
    ],
  },
  certificates: {
    endpoint: '/api/certificates',
    title: 'Certificates',
    icon: 'bi-patch-check',
    newLabel: 'certificate',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'issuer', label: 'Issuer' },
      { key: 'date', label: 'Date' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'date', label: 'Date', type: 'text', placeholder: '2021' },
      { name: 'icon', label: 'Icon (emoji)', type: 'text', placeholder: '📜' },
      { name: 'link', label: 'Certificate URL', type: 'text', placeholder: 'https://...' },
    ],
  },
  changelog: {
    endpoint: '/api/changelog',
    title: 'Changelog',
    icon: 'bi-clock-history',
    newLabel: 'entry',
    columns: [
      { key: 'version', label: 'Version' },
      { key: 'date', label: 'Date' },
      { key: 'title', label: 'Title' },
    ],
    fields: [
      { name: 'version', label: 'Version', type: 'text', placeholder: 'v2.1.0' },
      { name: 'date', label: 'Date', type: 'text', placeholder: '2026-09-08' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Notes', type: 'textarea' },
    ],
  },
}
