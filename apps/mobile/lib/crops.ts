export const CROP_EMOJI: Record<string, string> = {
  'Tomate':          '🍅',
  'Pepino':          '🥒',
  'Pimiento':        '🫑',
  'Berenjena':       '🍆',
  'Calabacín':       '🥬',
  'Calabaza':        '🎃',
  'Maíz':            '🌽',
  'Lechuga':         '🥬',
  'Espinaca':        '🥬',
  'Col':             '🥦',
  'Brócoli':         '🥦',
  'Coliflor':        '🥦',
  'Acelga':          '🥬',
  'Rúcula':          '🌿',
  'Perejil':         '🌿',
  'Albahaca':        '🌿',
  'Zanahoria':       '🥕',
  'Remolacha':       '🟣',
  'Nabo':            '🫚',
  'Patata':          '🥔',
  'Boniato':         '🍠',
  'Ajo':             '🧄',
  'Cebolla':         '🧅',
  'Puerro':          '🧅',
  'Judía verde':     '🫘',
  'Guisante':        '🫛',
  'Haba':            '🫘',
  'Garbanzo':        '🟡',
  'Lenteja':         '🟤',
  'Fresa':           '🍓',
  'Melón':           '🍈',
  'Sandía':          '🍉',
  'Uva':             '🍇',
  'Frambuesa':       '🫐',
  'Arándano':        '🫐',
  'Melocotón':       '🍑',
  'Albaricoque':     '🍑',
  'Cereza':          '🍒',
  'Limón':           '🍋',
  'Naranja':         '🍊',
  'Girasol':         '🌻',
  'Hierba aromática':'🌿',
}

export const CROP_NAMES = Object.keys(CROP_EMOJI)

export const getCropEmoji = (name: string): string =>
  CROP_EMOJI[name] ?? '🌱'

const deaccent = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const matchesCropSearch = (name: string, query: string): boolean =>
  deaccent(name).includes(deaccent(query))
