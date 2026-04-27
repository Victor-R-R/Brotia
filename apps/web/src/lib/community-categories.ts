export const CATEGORIES = [
  { key: 'PLAGAS',       label: 'Plagas y enfermedades', emoji: '🐛' },
  { key: 'RIEGO',        label: 'Riego y fertilización',  emoji: '💧' },
  { key: 'CULTIVOS',     label: 'Cultivos',               emoji: '🌱' },
  { key: 'CLIMA',        label: 'Clima y temporadas',     emoji: '🌤️' },
  { key: 'EQUIPAMIENTO', label: 'Equipamiento',           emoji: '🔧' },
  { key: 'GENERAL',      label: 'General',                emoji: '💬' },
] as const

export type CategoryKey = typeof CATEGORIES[number]['key']

export const getCategoryLabel = (key: string): string =>
  CATEGORIES.find(c => c.key === key)?.label ?? key

export const getCategoryEmoji = (key: string): string =>
  CATEGORIES.find(c => c.key === key)?.emoji ?? '💬'
