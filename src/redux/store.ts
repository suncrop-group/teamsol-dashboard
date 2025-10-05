import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // Use localStorage for web
import authSlice from './slices/AuthSlice';
import orderCreation from './slices/OrderCreationSlice';
import projectSlice from './slices/ProjectSlice';
import SalesSlice from './slices/SalesSlice';
import NotificationsSlice from './slices/NotificationsSlice';
import AppStateSlice from './slices/AppStateSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Persist config
const persistConfig = {
  key: 'root',
  storage,
  blacklist: ['sales', 'orderCreation'], // Only persist the auth slice
};

// Root reducer
const rootReducer = {
  auth: authSlice,
  orderCreation: orderCreation,
  project: projectSlice,
  sales: SalesSlice,
  notifications: NotificationsSlice,
  appState: AppStateSlice,
};

// Create persisted reducer
const persistedReducer = persistReducer(
  persistConfig,
  combineReducers(rootReducer)
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
