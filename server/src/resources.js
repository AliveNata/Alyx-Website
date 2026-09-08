// Single source of truth for the CRUD resources. Both the generic router and
// the seeder read this so columns never drift between them.
//
// jsonFields are stored as JSONB - serialized with JSON.stringify on write and
// returned as parsed JS by node-postgres on read.

export const RESOURCES = {
  skills: {
    table: 'skills',
    fields: ['category', 'name', 'icon', 'level', 'sort_order'],
    jsonFields: [],
  },
  projects: {
    table: 'projects',
    fields: ['title', 'description', 'tech', 'category', 'image', 'github', 'link', 'sort_order'],
    jsonFields: ['tech'],
  },
  experiences: {
    table: 'experiences',
    fields: ['exp_type', 'role', 'company', 'period', 'duration', 'location', 'work_type', 'description', 'technologies', 'projects', 'highlight', 'sort_order'],
    jsonFields: ['description', 'technologies', 'projects', 'highlight'],
  },
  awards: {
    table: 'awards',
    fields: ['title', 'description', 'icon', 'metrics', 'sort_order'],
    jsonFields: ['metrics'],
  },
  certificates: {
    table: 'certificates',
    fields: ['title', 'description', 'issuer', 'date', 'icon', 'link', 'sort_order'],
    jsonFields: [],
  },
  changelog: {
    table: 'changelog',
    fields: ['version', 'date', 'title', 'description', 'sort_order'],
    jsonFields: [],
  },
}
