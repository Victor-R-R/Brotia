import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:      '#F2FAF4',
        surface:         '#FFFFFF',
        'surface-alt':   '#E6F5EA',
        'surface-raised':'#D4EED9',
        primary:         '#1A7A30',
        'primary-hover': '#22A040',
        'primary-light': '#4DBB5A',
        pea:             '#4DBB5A',
        olive:           '#3D6E47',
        sage:            '#7ACC82',
        mint:            '#B8E8BF',
        foreground:      '#0B2610',
        muted:           '#1F5C2E',
        subtle:          '#4E8A58',
        border:          '#9ED4A6',
        'border-subtle': '#C4E8CA',
        frost:           '#BAE6FD',
        'frost-text':    '#0369A1',
        hail:            '#C7D2FE',
        'hail-text':     '#3730A3',
        wind:            '#FEF3C7',
        'wind-text':     '#92400E',
        danger:          '#FEE2E2',
        'danger-text':   '#991B1B',
        harvest:         '#CA8A04',
        'harvest-hover': '#A16207',
      },
    },
  },
}

export default config
