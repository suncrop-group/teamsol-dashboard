import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface AuthState {
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
  } as AuthState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUserData: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const {
  setAuthenticated,
  setUser,
  logout,
  updateUserData,
} = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectUser = (state: RootState) => state.auth.user;

export default authSlice.reducer;
