export type Region = 'china' | 'global'
export type MapProvider = 'maplibre' | 'amap'
export type MediaProvider = 'cloudinary' | 'disabled'
export type FontStrategy = 'system' | 'remote'
export type ExternalLinkStrategy = 'google' | 'amap' | 'none'
export type SocialLoginProvider = 'google' | 'apple'

export interface PlatformProfile {
  region: Region
  apiBaseUrl: string
  mapProvider: MapProvider
  mediaProvider: MediaProvider
  fontStrategy: FontStrategy
  externalLinkStrategy: ExternalLinkStrategy
  socialLoginProviders: SocialLoginProvider[]
  fonts: {
    sans: string
    serif: string
  }
  mapStyles: {
    roadmapLight: string
    roadmapDark: string
    satellite: string
    terrain: string
  }
}

const DEFAULT_SOCIAL_BY_REGION: Record<Region, SocialLoginProvider[]> = {
  global: ['google', 'apple'],
  china: [],
}

function normalizeRegion(value?: string): Region {
  return value?.trim().toLowerCase() === 'china' ? 'china' : 'global'
}

function normalizeList<T extends string>(value: string | undefined, supported: readonly T[]): T[] {
  if (!value?.trim()) return []

  const allowed = new Set<T>(supported)
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase() as T)
    .filter((entry): entry is T => allowed.has(entry))
}

const region = normalizeRegion(import.meta.env.VITE_REGION)
const socialLoginProviders = normalizeList(
  import.meta.env.VITE_SOCIAL_LOGIN_PROVIDERS,
  ['google', 'apple'] as const,
)

export const platformProfile: PlatformProfile = {
  region,
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').trim(),
  mapProvider: region === 'china' ? 'amap' : 'maplibre',
  mediaProvider:
    (import.meta.env.VITE_MEDIA_PROVIDER?.trim().toLowerCase() as MediaProvider | undefined) ??
    (region === 'china' ? 'disabled' : 'cloudinary'),
  fontStrategy:
    (import.meta.env.VITE_FONT_STRATEGY?.trim().toLowerCase() as FontStrategy | undefined) ??
    (region === 'china' ? 'system' : 'remote'),
  externalLinkStrategy:
    (import.meta.env.VITE_EXTERNAL_LINK_STRATEGY?.trim().toLowerCase() as ExternalLinkStrategy | undefined) ??
    (region === 'china' ? 'amap' : 'google'),
  socialLoginProviders:
    socialLoginProviders.length > 0 ? socialLoginProviders : DEFAULT_SOCIAL_BY_REGION[region],
  fonts: {
    sans:
      import.meta.env.VITE_FONT_SANS?.trim() ||
      "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    serif:
      import.meta.env.VITE_FONT_SERIF?.trim() ||
      "'Georgia', 'Noto Serif SC', 'Times New Roman', serif",
  },
  mapStyles: {
    roadmapLight:
      import.meta.env.VITE_MAP_STYLE_ROADMAP_LIGHT?.trim() ||
      'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    roadmapDark:
      import.meta.env.VITE_MAP_STYLE_ROADMAP_DARK?.trim() ||
      'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    satellite:
      import.meta.env.VITE_MAP_STYLE_SATELLITE?.trim() ||
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain:
      import.meta.env.VITE_MAP_STYLE_TERRAIN?.trim() ||
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  },
}

export function supportsSocialLogin(provider: SocialLoginProvider): boolean {
  return platformProfile.socialLoginProviders.includes(provider)
}
