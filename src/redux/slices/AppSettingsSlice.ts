import {createSlice} from '@reduxjs/toolkit';

export interface ProjectState {
  setOdooCred: {
    url: string;
    db: string;
    username: string;
    password: string;
  };

  color_scheme: {
    primary: string;
    secondary: string;
  };

  projectId: string;
}

const projectSlice = createSlice({
  name: 'appSettings',
  initialState: {
    setOdooCred: {
      url: '',
      db: '',
      username: '',
      password: '',
    },
    color_scheme: {
      primary: '',
      secondary: '',
    },
  } as ProjectState,
  reducers: {
    setOdooCred: (state, action) => {
      state.setOdooCred = action.payload;
    },
    setColorScheme: (state, action) => {
      state.color_scheme = action.payload;
    },

    setProjectId: (state, action) => {
      state.projectId = action.payload;
    },
  },
});

export const {setOdooCred, setColorScheme, setProjectId} = projectSlice.actions;

export default projectSlice.reducer;
