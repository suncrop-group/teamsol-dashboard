import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface AuthState {
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  odooAccessToken: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  odooAdmin: any;
  tokenExpiry: number | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    odooAccessToken: '',
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

    setOdooAccessToken: (state, action) => {
      state.odooAccessToken = action.payload.access_token;
      state.tokenExpiry = action.payload.expires_in;
    },

    setOdooAdmin: (state, action) => {
      state.odooAdmin = action.payload;
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.odooAdmin = null;
      state.odooAccessToken = '';
    },
  },
});

export const {
  setAuthenticated,
  setUser,
  logout,
  updateUserData,
  setOdooAccessToken,
  setOdooAdmin,
} = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export const selectUser = (state: RootState) => state.auth.user;

export const selectOdooAccessToken = (state: RootState) =>
  state.auth.odooAccessToken;

export const selectOdooAdmin = (state: RootState) => state.auth.odooAdmin;

export default authSlice.reducer;
