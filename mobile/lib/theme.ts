// Theme configuration matching web app
// Colors from tailwind.config.js and globals.css

export const colors = {
  bg: '#0a0a0f',
  surface: '#16161f',
  card: '#1e1e2e',
  text: '#e8e6e3',
  textMuted: '#9ca3af',
  accent: '#e94560',
  primary: '#e94560',
  secondary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  border: 'rgba(255, 255, 255, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 48,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Bird themes (matching web)
export interface BirdTheme {
  name: string;
  birdLogo: string; // Will use local assets
  accentColor: string;
}

export const birdThemes: Record<string, BirdTheme> = {
  robin: {
    name: 'Robin',
    birdLogo: 'robin',
    accentColor: '#e94560',
  },
  bluejay: {
    name: 'Blue Jay',
    birdLogo: 'bluejay',
    accentColor: '#3b82f6',
  },
  cardinal: {
    name: 'Cardinal',
    birdLogo: 'cardinal',
    accentColor: '#dc2626',
  },
  goldfinch: {
    name: 'Goldfinch',
    birdLogo: 'goldfinch',
    accentColor: '#eab308',
  },
};

export const defaultTheme = birdThemes.robin;
