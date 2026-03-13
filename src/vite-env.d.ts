/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_REGION?: 'china' | 'global'
  readonly VITE_MEDIA_PROVIDER?: 'cloudinary' | 'disabled'
  readonly VITE_SOCIAL_LOGIN_PROVIDERS?: string
  readonly VITE_FONT_STRATEGY?: 'system' | 'remote'
  readonly VITE_EXTERNAL_LINK_STRATEGY?: 'google' | 'amap' | 'none'
  readonly VITE_FONT_SANS?: string
  readonly VITE_FONT_SERIF?: string
  readonly VITE_MAP_STYLE_ROADMAP_LIGHT?: string
  readonly VITE_MAP_STYLE_ROADMAP_DARK?: string
  readonly VITE_MAP_STYLE_SATELLITE?: string
  readonly VITE_MAP_STYLE_TERRAIN?: string
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
