// Theme configuration matching the EXACT web app branding
// Colors from lib/theme.tsx in the web app

import { ImageSourcePropType } from 'react-native';

// Bird logo assets
export const birdImages: Record<string, ImageSourcePropType> = {
  'american-robin': require('../assets/birds/robin.png'),
  'northern-cardinal': require('../assets/birds/cardinal.png'),
  'eastern-bluebird': require('../assets/birds/bluebird.png'),
  'american-goldfinch': require('../assets/birds/goldfinch.png'),
  'baltimore-oriole': require('../assets/birds/oriole.png'),
  'indigo-bunting': require('../assets/birds/bunting.png'),
  'house-finch': require('../assets/birds/finch.png'),
  'cedar-waxwing': require('../assets/birds/waxwing.png'),
  'black-capped-chickadee': require('../assets/birds/chickadee.png'),
  'painted-bunting': require('../assets/birds/painted.png'),
};

export interface BirdTheme {
  id: string;
  name: string;
  shortName: string;
  description: string;
  image: ImageSourcePropType;
  colors: {
    primary: string;
    accent: string;
    bg: string;
    surface: string;
    card: string;
    text: string;
    textMuted: string;
  };
}

export const birdThemes: Record<string, BirdTheme> = {
  'american-robin': {
    id: 'american-robin',
    name: 'American Robin',
    shortName: 'Robin',
    description: 'Warm rust-orange with golden amber',
    image: birdImages['american-robin'],
    colors: {
      primary: '#D2691E',
      accent: '#F4A460',
      bg: '#1A1A1A',
      surface: '#2A2A2A',
      card: '#333333',
      text: '#F5F5F5',
      textMuted: '#A0A0A0',
    },
  },
  'northern-cardinal': {
    id: 'northern-cardinal',
    name: 'Northern Cardinal',
    shortName: 'Cardinal',
    description: 'Vivid crimson with soft coral pink',
    image: birdImages['northern-cardinal'],
    colors: {
      primary: '#C41E3A',
      accent: '#FF6B6B',
      bg: '#141414',
      surface: '#2A2228',
      card: '#3A2A32',
      text: '#FAFAFA',
      textMuted: '#B0A0A5',
    },
  },
  'eastern-bluebird': {
    id: 'eastern-bluebird',
    name: 'Eastern Bluebird',
    shortName: 'Bluebird',
    description: 'Soft sky blue with warm peach',
    image: birdImages['eastern-bluebird'],
    colors: {
      primary: '#6CA0DC',
      accent: '#E8A87C',
      bg: '#0F1520',
      surface: '#1A2535',
      card: '#243345',
      text: '#F0F4F8',
      textMuted: '#8BA4B8',
    },
  },
  'american-goldfinch': {
    id: 'american-goldfinch',
    name: 'American Goldfinch',
    shortName: 'Goldfinch',
    description: 'Bright lemon yellow with olive',
    image: birdImages['american-goldfinch'],
    colors: {
      primary: '#FFD700',
      accent: '#9CB071',
      bg: '#141810',
      surface: '#1E241A',
      card: '#2A3224',
      text: '#FFFEF5',
      textMuted: '#A8B098',
    },
  },
  'baltimore-oriole': {
    id: 'baltimore-oriole',
    name: 'Baltimore Oriole',
    shortName: 'Oriole',
    description: 'Deep orange with warm gold',
    image: birdImages['baltimore-oriole'],
    colors: {
      primary: '#FF6600',
      accent: '#FFB347',
      bg: '#12100E',
      surface: '#221E1A',
      card: '#2E2822',
      text: '#FFF8F0',
      textMuted: '#B0A090',
    },
  },
  'indigo-bunting': {
    id: 'indigo-bunting',
    name: 'Indigo Bunting',
    shortName: 'Bunting',
    description: 'Electric indigo with bright violet',
    image: birdImages['indigo-bunting'],
    colors: {
      primary: '#4B0082',
      accent: '#8A2BE2',
      bg: '#0C0A14',
      surface: '#1A1528',
      card: '#252038',
      text: '#F5F0FF',
      textMuted: '#9080A8',
    },
  },
  'house-finch': {
    id: 'house-finch',
    name: 'House Finch',
    shortName: 'Finch',
    description: 'Dusty rose-red with soft blush',
    image: birdImages['house-finch'],
    colors: {
      primary: '#B5495B',
      accent: '#D4A5A5',
      bg: '#171515',
      surface: '#252022',
      card: '#322A2E',
      text: '#F8F5F5',
      textMuted: '#A89898',
    },
  },
  'cedar-waxwing': {
    id: 'cedar-waxwing',
    name: 'Cedar Waxwing',
    shortName: 'Waxwing',
    description: 'Warm tan with berry red accent',
    image: birdImages['cedar-waxwing'],
    colors: {
      primary: '#C2A878',
      accent: '#8B0000',
      bg: '#14120E',
      surface: '#221F1A',
      card: '#2E2A24',
      text: '#F5F2EB',
      textMuted: '#A8A090',
    },
  },
  'black-capped-chickadee': {
    id: 'black-capped-chickadee',
    name: 'Black-capped Chickadee',
    shortName: 'Chickadee',
    description: 'Soft gray with warm buff',
    image: birdImages['black-capped-chickadee'],
    colors: {
      primary: '#8C8C8C',
      accent: '#D4B896',
      bg: '#121212',
      surface: '#1E1E1E',
      card: '#2A2A2A',
      text: '#FFFFFF',
      textMuted: '#909090',
    },
  },
  'painted-bunting': {
    id: 'painted-bunting',
    name: 'Painted Bunting',
    shortName: 'Painted',
    description: 'Premium multicolor theme',
    image: birdImages['painted-bunting'],
    colors: {
      primary: '#00AA44',
      accent: '#AAFF00',
      bg: '#0A1214',
      surface: '#142028',
      card: '#1E2E38',
      text: '#FFFFFF',
      textMuted: '#78A0A8',
    },
  },
};

// Default theme = American Robin (matches web app)
const defaultThemeId = 'american-robin';
const defaultTheme = birdThemes[defaultThemeId];

// Export the default (Robin) colors for use throughout the app
export const colors = {
  bg: defaultTheme.colors.bg,
  surface: defaultTheme.colors.surface,
  card: defaultTheme.colors.card,
  text: defaultTheme.colors.text,
  textMuted: defaultTheme.colors.textMuted,
  accent: defaultTheme.colors.accent,
  primary: defaultTheme.colors.primary,
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
  xxl: 24,
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

export const defaultBirdImage = birdImages['american-robin'];
