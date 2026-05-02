export const CROP_EMOJI: Record<string, string> = {
  // Frutas de huerta
  'Tomate':          '🍅',
  'Pepino':          '🥒',
  'Pimiento':        '🫑',
  'Berenjena':       '🍆',
  'Calabacín':       '🥬',
  'Calabaza':        '🎃',
  'Maíz':            '🌽',
  // Hoja verde
  'Lechuga':         '🥬',
  'Espinaca':        '🥬',
  'Col':             '🥦',
  'Brócoli':         '🥦',
  'Coliflor':        '🥦',
  'Acelga':          '🥬',
  'Rúcula':          '🌿',
  'Perejil':         '🌿',
  'Albahaca':        '🌿',
  // Raíz y tubérculo
  'Zanahoria':       '🥕',
  'Remolacha':       '🟣',
  'Nabo':            '🫚',
  'Patata':          '🥔',
  'Boniato':         '🍠',
  'Ajo':             '🧄',
  'Cebolla':         '🧅',
  'Puerro':          '🧅',
  // Legumbres
  'Judía verde':     '🫘',
  'Guisante':        '🫛',
  'Haba':            '🫘',
  'Garbanzo':        '🟡',
  'Lenteja':         '🟤',
  // Frutas
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
  // Cereales / otros
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
