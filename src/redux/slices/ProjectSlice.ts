import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface ProjectState {
  logo: any;
  color_scheme: {
    primary: string;
    secondary: string;
  };

  projectDetails: {
    title: string;
    description: string;
  };

  projectId: string;
}

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    color_scheme: {
      primary: '',
      secondary: '',
    },
    projectDetails: {
      title: '',
      description: '',
    },
  } as ProjectState,
  reducers: {
    setColorScheme: (state, action) => {
      state.color_scheme = action.payload;
    },

    setProjectId: (state, action) => {
      state.projectId = action.payload;
    },

    setProjectDetails: (state, action) => {
      state.projectDetails = action.payload;
    },

    setLogo: (state, action) => {
      state.logo = action.payload;
    },
  },
});

export const {
  setColorScheme,
  setProjectId,
  setLogo,
  setProjectDetails,
} = projectSlice.actions;

export const selectLogo = (state: RootState) => state.project.logo;
export const selectColorScheme = (state: RootState) =>
  state.project.color_scheme;
export const selectProjectId = (state: RootState) => state.project.projectId;
export const selectProjectDetails = (state: RootState) =>
  state.project.projectDetails;

export default projectSlice.reducer;
