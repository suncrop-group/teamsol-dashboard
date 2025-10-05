import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface ProjectState {
  open: boolean;
  notificationCount?: number;
  modules?: HomeTile[];
}

const appStateSlice = createSlice({
  name: 'appSettings',
  initialState: {
    open: false,
  } as ProjectState,
  reducers: {
    setAppState: (state, action) => {
      state.open = action.payload;
    },
    setNotificationCount: (state, action) => {
      state.notificationCount = action.payload;
    },
    setModules: (state, action) => {
      state.modules = action.payload;
    },
  },
});

export const { setAppState, setNotificationCount, setModules } =
  appStateSlice.actions;

export const selectAppState = (state: RootState) => state.appState.open;
export const selectNotificationCount = (state: RootState) =>
  state.appState.notificationCount;
export const selectModules = (state: RootState) => state.appState.modules;

export default appStateSlice.reducer;
