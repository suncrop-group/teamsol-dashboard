import { useEffect, useState } from 'react';

// Chrome and Edge fire this when the site can be installed; it is kept so
// the app can offer the install itself.
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let saved: InstallEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    saved = event as InstallEvent;
    listeners.forEach((listener) => listener());
  });
  window.addEventListener('appinstalled', () => {
    saved = null;
    listeners.forEach((listener) => listener());
  });
}

/** True when the dashboard is running as an installed app. */
export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Whether the dashboard can be installed as an app from here, and how.
 * `install` opens the browser's own prompt where there is one. Safari on
 * iPhone has none: there `iosHint` is true and the user is told to use
 * Share → Add to Home Screen.
 */
export const useInstallPrompt = () => {
  const [, refresh] = useState(0);
  useEffect(() => {
    const listener = () => refresh((count) => count + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const installed = isInstalled();
  return {
    canInstall: !installed && !!saved,
    iosHint: !installed && !saved && isIos(),
    install: async () => {
      if (!saved) return;
      await saved.prompt();
      await saved.userChoice;
      saved = null;
      refresh((count) => count + 1);
    },
  };
};
