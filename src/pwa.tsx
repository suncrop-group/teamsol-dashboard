// Registers the service worker and brings a new deploy in.
//
// An installed app on a phone (iOS above all) is rarely loaded afresh: it is
// resumed from where it was left, so a check made only when the page loads
// almost never runs, and a new service worker taking over does not change
// the page already on screen. So the check is repeated whenever the app
// comes back into view, and the page is reloaded once the new version has
// taken over: at once when nobody is looking, otherwise when asked or the
// next time the app is brought back.
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';

// A new version found this soon after opening reloads without asking.
const JUST_OPENED_MS = 10_000;
const CHECK_EVERY_MS = 30 * 60 * 1000;
const NOTICE_ID = 'app-update';

export const registerPwa = () => {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  // No controller yet means a first install, which is not an update.
  const hadController = !!navigator.serviceWorker.controller;
  const openedAt = Date.now();
  let updateReady = false;
  let reloading = false;

  const reload = () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (
      document.visibilityState === 'hidden' ||
      Date.now() - openedAt < JUST_OPENED_MS
    ) {
      reload();
      return;
    }
    // Someone is using the app: do not take the screen from under them.
    updateReady = true;
    notifications.show({
      id: NOTICE_ID,
      title: 'New version available',
      message: (
        <Button size="compact-sm" mt={4} onClick={reload}>
          Refresh now
        </Button>
      ),
      autoClose: false,
      withCloseButton: true,
    });
  });

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        // Always ask the server for the worker, never the browser's copy.
        updateViaCache: 'none',
      });
      const check = () => registration.update().catch(() => {});

      const onReturn = () => {
        if (document.visibilityState !== 'visible') return;
        if (updateReady) reload();
        else check();
      };
      document.addEventListener('visibilitychange', onReturn);
      // iOS brings an installed app back with `pageshow` rather than a load.
      window.addEventListener('pageshow', onReturn);
      window.addEventListener('online', check);
      window.setInterval(check, CHECK_EVERY_MS);
      check();
    } catch {
      // No service worker: the site still works, straight from the network.
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
};
