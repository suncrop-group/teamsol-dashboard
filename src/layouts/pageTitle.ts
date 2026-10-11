import { useSyncExternalStore } from 'react';

// The title of the screen being shown, as its page states it ("Edit Toll",
// "Order #1042"). On a phone the top bar shows it beside the back arrow, so
// the page does not repeat it underneath.
let current = '';
const listeners = new Set<() => void>();

export const setPageTitle = (title: string) => {
  if (title === current) return;
  current = title;
  listeners.forEach((listener) => listener());
};

export const usePageTitle = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => current,
  );
