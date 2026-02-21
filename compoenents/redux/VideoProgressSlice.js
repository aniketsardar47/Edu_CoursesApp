import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  progressByVideo: {}
};

const videoProgressSlice = createSlice({
  name: "videoProgress",
  initialState,
  reducers: {
    updateProgress: (state, action) => {
      const { videoId, watchedSeconds, totalDuration, percentage, lastPosition } = action.payload;

      state.progressByVideo[videoId] = {
        watchedSeconds,
        totalDuration,
        percentage,
        lastPosition,
        lastUpdated: Date.now()
      };
    }
  }
});

export const { updateProgress } = videoProgressSlice.actions;
export default videoProgressSlice.reducer;