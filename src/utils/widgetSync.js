import { Capacitor, registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const TrackoWidget = registerPlugin('TrackoWidget')

// streak, best streak and name
export async function syncWidget({ streak, best, name }) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Preferences.set({ key: 'widget_streak', value: String(streak ?? 0) })
    await Preferences.set({ key: 'widget_best', value: String(best ?? 0) })
    await Preferences.set({ key: 'widget_name', value: (name || '').split(' ')[0] })
    await TrackoWidget.refresh()
  } catch (e) {
    console.error('Widget sync failed', e)
  }
}

// colours: follows the app palette and light/dark mode
export async function syncWidgetTheme({ bg, text }) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Preferences.set({ key: 'widget_bg', value: bg })
    await Preferences.set({ key: 'widget_text', value: text })
    await TrackoWidget.refresh()
  } catch (e) {
    console.error('Widget theme sync failed', e)
  }
}