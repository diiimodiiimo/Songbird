import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/**
 * Returns the base URL for API calls.
 * In native apps, API calls must use the full production URL since
 * the web assets are bundled locally and there's no server.
 * On web, relative paths work fine.
 */
export function getApiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://songbird.app'
  }
  return ''
}
