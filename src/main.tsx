import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import { useMemo } from 'react';
import App from './App.tsx';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './redux/store.ts';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { selectColorScheme } from './redux/slices/ProjectSlice.ts';
import { buildTheme } from './theme.ts';
import { registerPwa } from './pwa.tsx';

registerPwa();

const ThemedApp = () => {
  const colorScheme = useSelector(selectColorScheme);
  const theme = useMemo(
    () => buildTheme(colorScheme?.primary),
    [colorScheme?.primary],
  );

  return (
    // The chosen scheme is remembered in localStorage by Mantine; "auto"
    // follows the operating system until the user picks one.
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ThemedApp />
    </PersistGate>
  </Provider>,
);
