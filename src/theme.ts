// Obsidian instrument palette. Cyan identifies navigation and primary
// controls. Safety colours are reserved for real runtime states and are always
// paired with an icon and plain copy.
export const colors = {
  canvas: '#030812',
  canvasRaised: '#06101C',
  surface: '#091421',
  surfaceRaised: '#0E1A29',
  surfacePressed: '#142438',
  navSurface: '#07111EF5',
  line: '#18283A',
  lineStrong: '#263A52',

  text: '#F7FAFE',
  muted: '#A6B2C3',
  faint: '#718096',

  cyan: '#19C8FF',
  cyanStrong: '#2997FF',
  cyanSoft: '#0A2A3A',
  cyanWash: '#071D2B',

  green: '#58E39B',
  greenSoft: '#0B2A20',
  amber: '#F6BC4C',
  amberSoft: '#2D220C',
  red: '#FF5C68',
  redSoft: '#351218',
  violet: '#A995FF',
  violetSoft: '#1D1838',

  white: '#FFFFFF',
  ink: '#02070E',
} as const;

export const radius = {
  small: 12,
  medium: 16,
  large: 22,
  hero: 30,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const typeScale = {
  micro: 11,
  label: 12,
  body: 14,
  bodyLarge: 16,
  title: 30,
  speed: 104,
} as const;
