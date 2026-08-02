/**
 * useNotifications — Browser Notification API wrapper
 * Handles permission requests and fires desktop notifications.
 * Preferences are stored in localStorage (notif_vaccines, notif_teleconsult, etc.)
 */

export function useNotifications() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  /** Ask user for notification permission. Returns true if granted. */
  const requestPermission = async (): Promise<boolean> => {
    if (!supported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  };

  /** Show a desktop notification (no-op if permission not granted). */
  const notify = (title: string, options?: NotificationOptions): void => {
    if (!supported || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        icon: '/favicon.jpeg',
        badge: '/favicon.jpeg',
        ...options,
      });
    } catch {
      // Some browsers block notifications silently — ignore
    }
  };

  const isGranted = supported && Notification.permission === 'granted';
  const isDenied  = supported && Notification.permission === 'denied';

  return { requestPermission, notify, isGranted, isDenied, supported };
}
