import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background:      '#FAFCF7',
        surface:         '#FFFFFF',
        'surface-alt':   '#F2F7EE',
        primary:         '#2D5A1B',
        'primary-hover': '#3D7525',
        pea:             '#8DB84A',
        olive:           '#6B7C3D',
        sage:            '#A8C185',
        mint:            '#D4E6C3',
        foreground:      '#1C2E0F',
        muted:           '#4B6838',
        subtle:          '#7A9B6A',
        border:          '#C8DEB5',
        'border-subtle': '#E2EFDA',
        harvest:         '#CA8A04',
        frost:           '#BAE6FD',
        'frost-text':    '#0369A1',
        danger:          '#FEE2E2',
        'danger-text':   '#991B1B',
      },
    },
  },
}

export default config
