import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

export async function syncWidget({ streak, best }) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Preferences.set({ key: 'widget_streak', value: String(streak ?? 0) })
    await Preferences.set({ key: 'widget_best', value: String(best ?? '') })
  } catch (e) {
    console.error('Widget sync failed', e)
  }
}