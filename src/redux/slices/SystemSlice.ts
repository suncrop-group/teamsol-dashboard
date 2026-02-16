import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface SystemState {
  isUnderMaintenance: boolean;
  maintenanceMessage: string;
  maintenanceUntil: string | null;
}

const initialState: SystemState = {
  isUnderMaintenance: false,
  maintenanceMessage: '',
  maintenanceUntil: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setMaintenanceMode: (
      state,
      action: PayloadAction<{
        isUnderMaintenance: boolean;
        message?: string;
        maintenanceUntil?: string | null;
      }>,
    ) => {
      state.isUnderMaintenance = action.payload.isUnderMaintenance;
      if (action.payload.message) {
        state.maintenanceMessage = action.payload.message;
      }
      if (action.payload.maintenanceUntil !== undefined) {
        state.maintenanceUntil = action.payload.maintenanceUntil;
      }
    },
    resetMaintenanceMode: (state) => {
      state.isUnderMaintenance = false;
      state.maintenanceMessage = '';
    },
  },
});

export const { setMaintenanceMode, resetMaintenanceMode } = systemSlice.actions;

export const selectIsUnderMaintenance = (state: RootState) =>
  state.system.isUnderMaintenance;
export const selectMaintenanceMessage = (state: RootState) =>
  state.system.maintenanceMessage;
export const selectMaintenanceUntil = (state: RootState) =>
  state.system.maintenanceUntil;

export default systemSlice.reducer;
