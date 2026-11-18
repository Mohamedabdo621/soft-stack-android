import { DailyChallengeConfig, EnvironmentTheme, LevelConfig, PillowDesign } from './types';

// Signature ultra-smooth satin pastel marshmallow pillows matching the user's pillow reference,
// alongside the Sunny Royal Courtyard and unlockable pastel/specialty cushions.
export const PILLOW_DESIGNS: PillowDesign[] = [
  {
    id: 'pastel-satin',
    name: 'Pastel Satin',
    description: 'Silky baby-blue and pastel-pink marshmallow cushions with pearlescent glow.',
    cost: 0,
    shapeStyle: 'classic',
    palette: ['#D5EBFF', '#F6B8DE', '#DCEEFF', '#F9CBE7'],
    pipingColor: '#FFFFFF',
    accentColor: '#FFF5FB',
    previewGradient: 'linear-gradient(135deg, #D5EBFF 0%, #F6B8DE 100%)',
  },
  {
    id: 'royal-courtyard',
    name: 'Royal Courtyard',
    description: 'Vibrant royal blue, warm sandstone cream, golden yellow, and coral red.',
    cost: 0,
    shapeStyle: 'classic',
    palette: ['#2279F0', '#EFE2CA', '#F6BE23', '#E6423B', '#4B97FF', '#F5EAD6'],
    pipingColor: '#FFFFFF',
    accentColor: '#FFD43B',
    previewGradient: 'linear-gradient(135deg, #2279F0 0%, #EFE2CA 50%, #E6423B 100%)',
  },
  {
    id: 'pink-cloud',
    name: 'Pink Cloud',
    description: 'Dreamy baby pink and soft rose satin cushions.',
    cost: 40,
    shapeStyle: 'classic',
    palette: ['#F9A8D4', '#FBCFE8', '#FDA4AF', '#FFF1F2', '#F472B6'],
    pipingColor: '#FFFDF9',
    accentColor: '#FDE68A',
    previewGradient: 'linear-gradient(135deg, #F9A8D4 0%, #FFF1F2 100%)',
  },
  {
    id: 'lavender-fluff',
    name: 'Lavender Fluffy',
    description: 'Calm lilac, soft violet, and cloud-white quilted pillows.',
    cost: 60,
    shapeStyle: 'quilted',
    palette: ['#C4B5FD', '#DDD6FE', '#A78BFA', '#F5F3FF', '#E9D5FF'],
    pipingColor: '#FFFFFF',
    accentColor: '#FDE047',
    previewGradient: 'linear-gradient(135deg, #A78BFA 0%, #EDE9FE 100%)',
  },
  {
    id: 'mint-cushion',
    name: 'Mint Cushion',
    description: 'Refreshing pastel mint, seafoam, and warm buttercream.',
    cost: 80,
    shapeStyle: 'quilted',
    palette: ['#6EE7B7', '#A7F3D0', '#5EEAD4', '#ECFDF5', '#99F6E4'],
    pipingColor: '#FFFFFF',
    accentColor: '#FCD34D',
    previewGradient: 'linear-gradient(135deg, #6EE7B7 0%, #ECFDF5 100%)',
  },
  {
    id: 'blue-marshmallow',
    name: 'Blue Marshmallow',
    description: 'Sky blue and crisp cerulean marshmallow pillows.',
    cost: 100,
    shapeStyle: 'classic',
    palette: ['#93C5FD', '#BAE6FD', '#60A5FA', '#E0F2FE', '#7DD3FC'],
    pipingColor: '#FFFFFF',
    accentColor: '#FBBF24',
    previewGradient: 'linear-gradient(135deg, #60A5FA 0%, #E0F2FE 100%)',
  },
  {
    id: 'cream-classic',
    name: 'Cream Linen',
    description: 'Warm travertine cream, honey peach, and soft ivory satin.',
    cost: 120,
    shapeStyle: 'quilted',
    palette: ['#F5E8D0', '#FDE6C4', '#FDBA74', '#FFFBF2', '#E9D5B5'],
    pipingColor: '#FFFDF9',
    accentColor: '#2279F0',
    previewGradient: 'linear-gradient(135deg, #F5E8D0 0%, #FDBA74 100%)',
  },
  {
    id: 'rainbow-dream',
    name: 'Rainbow Dream',
    description: 'Cheerful pastel spectrum cycling with every cushion.',
    cost: 160,
    shapeStyle: 'rainbow',
    palette: ['#FDA4AF', '#FDE047', '#86EFAC', '#93C5FD', '#C4B5FD', '#F9A8D4'],
    pipingColor: '#FFFFFF',
    accentColor: '#FFFFFF',
    previewGradient: 'linear-gradient(135deg, #FDA4AF 0%, #FDE047 35%, #93C5FD 70%, #C4B5FD 100%)',
  },
  {
    id: 'star-pillow',
    name: 'Starry Patch',
    description: 'Pastel cushions crowned with an embroidered golden star.',
    cost: 200,
    shapeStyle: 'star',
    palette: ['#93C5FD', '#FDE047', '#C4B5FD', '#F9A8D4', '#6EE7B7'],
    pipingColor: '#FEF08A',
    accentColor: '#FACC15',
    previewGradient: 'linear-gradient(135deg, #93C5FD 0%, #FACC15 100%)',
  },
  {
    id: 'heart-pillow',
    name: 'Heart Stitch',
    description: 'Plush blush & rose pillows topped with a stitched heart emblem.',
    cost: 240,
    shapeStyle: 'heart',
    palette: ['#FB7185', '#F9A8D4', '#FDA4AF', '#FFE4E6', '#FDBA74'],
    pipingColor: '#FFFFFF',
    accentColor: '#FFF1F2',
    previewGradient: 'linear-gradient(135deg, #FB7185 0%, #FDA4AF 100%)',
  },
];

export const ENVIRONMENT_THEMES: EnvironmentTheme[] = [
  {
    id: 'pastel-city',
    name: 'Pastel Bridge City',
    description: 'Dreamy waterfront city with an arch bridge, glowing lanterns, canal boats, and sky balloons.',
    cost: 0,
    skyTop: '#A5D8FF',
    skyBottom: '#FFE5F4',
    fogColor: '#F3E5F8',
    waterColor: '#5DAEFF',
    waterHighlight: '#A5D8FF',
    bridgeColor: '#FFF5EA',
    bridgeTrimColor: '#F4C6DF',
    keyLightColor: '#FFF9F5',
    hemiSkyColor: '#D6ECFF',
    hemiGroundColor: '#F4CBE3',
    cloudColor: '#FFFFFF',
    hasStars: false,
    hasFloatingSparkles: true,
    sceneryStyle: 'city',
  },
  {
    id: 'pastel-studio',
    name: 'Pastel Blush Studio',
    description: 'Serene soft pink studio gradient with dreamy floating orbs.',
    cost: 0,
    skyTop: '#FFD6F2',
    skyBottom: '#FFEAF9',
    fogColor: '#FFE5F7',
    waterColor: '#FFD6F2',
    waterHighlight: '#FFF0FA',
    bridgeColor: '#FFEAF9',
    bridgeTrimColor: '#FBCFE8',
    keyLightColor: '#FFF9FC',
    hemiSkyColor: '#FFF0FA',
    hemiGroundColor: '#F5C6E6',
    cloudColor: '#FFFFFF',
    hasStars: false,
    hasFloatingSparkles: true,
    sceneryStyle: 'studio',
  },
  {
    id: 'sunny-courtyard',
    name: 'Sunny Courtyard',
    description: 'Bright sandstone bridge over sparkling royal-blue water.',
    cost: 0,
    skyTop: '#3B95FF',
    skyBottom: '#CBE6FF',
    fogColor: '#B8DCFF',
    waterColor: '#1964C8',
    waterHighlight: '#3B8CF8',
    bridgeColor: '#EDE0C8',
    bridgeTrimColor: '#D6C09A',
    keyLightColor: '#FFF7E8',
    hemiSkyColor: '#9BD0FF',
    hemiGroundColor: '#D9C3A3',
    cloudColor: '#FFFFFF',
    hasStars: false,
    hasFloatingSparkles: false,
    sceneryStyle: 'courtyard',
  },
  {
    id: 'pastel-sky',
    name: 'Dreamy Pastel Sky',
    description: 'Soft baby-pink and lavender clouds in a tranquil sky.',
    cost: 80,
    skyTop: '#C4B5FD',
    skyBottom: '#FDE8F3',
    fogColor: '#F5E4F3',
    waterColor: '#E9D5FF',
    waterHighlight: '#FCE7F3',
    bridgeColor: '#FFF5F9',
    bridgeTrimColor: '#FBCFE8',
    keyLightColor: '#FFF5F7',
    hemiSkyColor: '#E9D5FF',
    hemiGroundColor: '#FBCFE8',
    cloudColor: '#FFF9FC',
    hasStars: false,
    hasFloatingSparkles: true,
    sceneryStyle: 'studio',
  },
  {
    id: 'fluffy-cloud',
    name: 'Fluffy Cloud World',
    description: 'Sky-blue breeze and pure whipped-cream cloud banks.',
    cost: 120,
    skyTop: '#93C5FD',
    skyBottom: '#E0F2FE',
    fogColor: '#DCEFFF',
    waterColor: '#BAE6FD',
    waterHighlight: '#F0F9FF',
    bridgeColor: '#FFFFFF',
    bridgeTrimColor: '#BAE6FD',
    keyLightColor: '#FFFDF7',
    hemiSkyColor: '#BAE6FD',
    hemiGroundColor: '#E2E8F0',
    cloudColor: '#FFFFFF',
    hasStars: false,
    hasFloatingSparkles: false,
    sceneryStyle: 'studio',
  },
  {
    id: 'pink-sunset',
    name: 'Pink Sunset World',
    description: 'Warm peach, rose coral, and golden twilight reflections.',
    cost: 150,
    skyTop: '#F9A8D4',
    skyBottom: '#FEF3C7',
    fogColor: '#FDE2E4',
    waterColor: '#FBCFE8',
    waterHighlight: '#FDE68A',
    bridgeColor: '#FFF5F0',
    bridgeTrimColor: '#FECDD3',
    keyLightColor: '#FFE8D6',
    hemiSkyColor: '#FDBA74',
    hemiGroundColor: '#FDA4AF',
    cloudColor: '#FFF1E6',
    hasStars: false,
    hasFloatingSparkles: true,
    sceneryStyle: 'studio',
  },
  {
    id: 'mint-garden',
    name: 'Mint Garden',
    description: 'Crisp mint-green meadows, cream stone, and sunbeams.',
    cost: 180,
    skyTop: '#34D399',
    skyBottom: '#ECFDF5',
    fogColor: '#D1FAE5',
    waterColor: '#2DD4BF',
    waterHighlight: '#99F6E4',
    bridgeColor: '#FAF5E8',
    bridgeTrimColor: '#A7F3D0',
    keyLightColor: '#FFFBEB',
    hemiSkyColor: '#A7F3D0',
    hemiGroundColor: '#D1FAE5',
    cloudColor: '#FFFFFF',
    hasStars: false,
    hasFloatingSparkles: true,
  },
  {
    id: 'starry-night',
    name: 'Starry Night World',
    description: 'Cozy indigo night sky dotted with glowing golden stars.',
    cost: 220,
    skyTop: '#1E2A68',
    skyBottom: '#43539D',
    fogColor: '#364488',
    waterColor: '#172554',
    waterHighlight: '#3B52A8',
    bridgeColor: '#E2E8F0',
    bridgeTrimColor: '#94A3B8',
    keyLightColor: '#E0E7FF',
    hemiSkyColor: '#818CF8',
    hemiGroundColor: '#312E81',
    cloudColor: '#CBD5E1',
    hasStars: true,
    hasFloatingSparkles: true,
  },
];

export function getPillowDesign(id: string): PillowDesign {
  return PILLOW_DESIGNS.find((p) => p.id === id) ?? PILLOW_DESIGNS[0];
}

export function getEnvironmentTheme(id: string): EnvironmentTheme {
  return ENVIRONMENT_THEMES.find((t) => t.id === id) ?? ENVIRONMENT_THEMES[0];
}

// Deterministic level generator supporting hundreds of levels (1..500+)
export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(1, Math.floor(level));

  let tierName = 'Pastel Bridge City';
  let recommendedThemeId = 'pastel-city';
  let paletteOverride: string[] | undefined;

  if (safeLevel <= 10) {
    tierName = 'Pastel Bridge City';
    recommendedThemeId = 'pastel-city';
    paletteOverride = ['#D5EBFF', '#F6B8DE', '#DCEEFF', '#F9CBE7'];
  } else if (safeLevel <= 20) {
    tierName = 'Mint & Sky Clouds';
    recommendedThemeId = 'mint-garden';
    paletteOverride = ['#6EE7B7', '#60A5FA', '#A7F3D0', '#93C5FD', '#FEF08A'];
  } else if (safeLevel <= 30) {
    tierName = 'Rainbow Sparkle';
    recommendedThemeId = 'fluffy-cloud';
    paletteOverride = ['#FB7185', '#FBBF24', '#34D399', '#38BDF8', '#A78BFA'];
  } else if (safeLevel <= 50) {
    tierName = 'Pink Sunset Heights';
    recommendedThemeId = 'pink-sunset';
    paletteOverride = ['#F472B6', '#FDBA74', '#FDA4AF', '#FDE68A', '#C4B5FD'];
  } else {
    const cycle = Math.floor((safeLevel - 51) / 15) % 6;
    const themeCycle = [
      'starry-night',
      'sunny-courtyard',
      'pastel-sky',
      'pink-sunset',
      'mint-garden',
      'fluffy-cloud',
    ];
    recommendedThemeId = themeCycle[cycle];
    tierName = `Master Sky Tier ${Math.floor((safeLevel - 51) / 15) + 1}`;
  }

  // Gentle early progression that stays smooth and fair into the hundreds
  const targetHeight = Math.min(28, 6 + Math.floor((safeLevel - 1) * 0.45));
  const sparePillows = safeLevel <= 5 ? 5 : safeLevel <= 20 ? 4 : 3;
  const maxPillows = targetHeight + sparePillows;

  // Easy early speeds, smoothly scaling with diminishing returns so it never feels impossible
  const baseSpeed = 2.0 + Math.min(3.4, (safeLevel - 1) * 0.085);
  const speedIncrement = 0.04 + Math.min(0.06, (safeLevel - 1) * 0.0012);
  const rewardCoins = 15 + Math.min(85, safeLevel * 2);

  return {
    level: safeLevel,
    title: `Level ${safeLevel}`,
    tierName,
    targetHeight,
    maxPillows,
    baseSpeed,
    speedIncrement,
    rewardCoins,
    recommendedThemeId,
    paletteOverride,
  };
}

export function getDailyChallengeConfig(date = new Date()): DailyChallengeConfig {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  // Simple deterministic hash from dateKey
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  const targetHeight = 12 + (hash % 7); // 12..18 pillows
  const maxPillows = targetHeight + 3;
  const baseSpeed = 2.6 + ((hash % 5) * 0.18);

  const palettes = [
    ['#2279F0', '#F6BE23', '#EFE2CA', '#E6423B'],
    ['#F472B6', '#C4B5FD', '#6EE7B7', '#FDE68A'],
    ['#38BDF8', '#FB7185', '#FBBF24', '#FFFFFF'],
  ];

  return {
    dateKey,
    title: `Daily Stack · ${month}/${day}`,
    targetHeight,
    maxPillows,
    baseSpeed,
    rewardCoins: 60,
    palette: palettes[hash % palettes.length],
  };
}
