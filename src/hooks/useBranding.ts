import { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { selectLogo, selectProjectName } from '@/redux/slices/ProjectSlice';

const DEFAULT_TITLE = 'TeamSol';
// Suncrop's logo: used whenever the project has none of its own.
const DEFAULT_ICON = '/suncrop-logo.png';

/** Point the browser tab's icon at `href`. */
const setIcon = (href: string) => {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  // The type in index.html is for the default icon; a project's logo may be
  // any kind of image.
  link.removeAttribute('type');
  if (link.getAttribute('href') !== href) link.href = href;
};

/**
 * Makes the browser tab carry the project's own name and logo instead of
 * the same title and icon for every company. Called once, at the top of the
 * app.
 *
 * It runs before the pages' own effects on every navigation, so a page that
 * sets a more specific title (an order number, "Add Expense") still wins,
 * and the title falls back to the project's when that page is left.
 */
export const useBranding = () => {
  const name = useSelector(selectProjectName);
  const logo = useSelector(selectLogo);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    document.title = name ? `${name} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [name, pathname]);

  useLayoutEffect(() => {
    setIcon(typeof logo === 'string' && logo ? logo : DEFAULT_ICON);
  }, [logo]);
};
