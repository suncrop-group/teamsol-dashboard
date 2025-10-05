import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface Notifications {
  url: string;
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  createdAt: string;
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [] as Notifications[],
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
  },
});

export const { setNotifications } = notificationsSlice.actions;

export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;

export default notificationsSlice.reducer;
