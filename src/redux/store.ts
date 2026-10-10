import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // Use localStorage for web
import authSlice from './slices/AuthSlice';
import orderCreation from './slices/OrderCreationSlice';
import projectSlice from './slices/ProjectSlice';
import SalesSlice from './slices/SalesSlice';
import NotificationsSlice from './slices/NotificationsSlice';
import AppStateSlice from './slices/AppStateSlice';
import systemSlice from './slices/SystemSlice';
import {
  createMigrate,
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Earlier builds kept the Odoo URL, login, password and session in the
// browser. The dashboard no longer uses any of it, so it is deleted from what
// is already stored on each user's machine.
const migrations = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  1: (state: any) => {
    if (!state) return state;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { odooAccessToken, odooAdmin, tokenExpiry, ...auth } =
      state.auth || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { setOdooCred, ...project } = state.project || {};

    // The cached profile carried the same credentials.
    if (auth.user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { odooAdmin: _admin, ...user } = auth.user;
      if (user.project) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { odoo_configuration, ...userProject } = user.project;
        user.project = userProject;
      }
      auth.user = user;
    }

    return { ...state, auth, project };
  },
};

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  migrate: createMigrate(migrations, { debug: false }),
  storage,
  blacklist: ['sales', 'orderCreation', 'system'], // system shouldn't be persisted to avoid stale maintenance state
};

// Root reducer
const rootReducer = {
  auth: authSlice,
  orderCreation: orderCreation,
  project: projectSlice,
  sales: SalesSlice,
  notifications: NotificationsSlice,
  appState: AppStateSlice,
  system: systemSlice,
};

// Create persisted reducer
const persistedReducer = persistReducer(
  persistConfig,
  combineReducers(rootReducer),
);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: false, // Disable immutable state invariant middleware for performance
    }),
});

// Persistor
export const persistor = persistStore(store);

// TypeScript types (if using TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
