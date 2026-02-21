import { createSlice } from '@reduxjs/toolkit';

const downloadSlice = createSlice({
  name: 'downloads',
  initialState: {
    videos: [], // Stores { id, title, localUri, thumbnail, courseId }
  },
  reducers: {
    addDownload: (state, action) => {
      const exists = state.videos.find(v => v.id === action.payload.id);
      if (!exists) {
        state.videos.push(action.payload);
      }
    },
    removeDownload: (state, action) => {
      state.videos = state.videos.filter(v => v.id !== action.payload);
    },
  },
});

export const { addDownload, removeDownload } = downloadSlice.actions;
export default downloadSlice.reducer;