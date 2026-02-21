import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  progressByVideo: {}
};

const videoProgressSlice = createSlice({
  name: "videoProgress",
  initialState,
  reducers: {
    updateVideoProgress: (state, action) => {
      const { videoId, watchedSeconds, totalDuration, lastPosition } = action.payload;

      const existingProgress = state.progressByVideo[videoId] || {
        watchedSeconds: 0,
        totalDuration: 0,
        lastPosition: 0,
        percentage: 0
      };

      const newWatchedSeconds = Math.max(existingProgress.watchedSeconds, watchedSeconds);
      const newTotalDuration = totalDuration || existingProgress.totalDuration;
      const percentage = newTotalDuration > 0 ? (newWatchedSeconds / newTotalDuration) * 100 : 0;

      state.progressByVideo[videoId] = {
        watchedSeconds: newWatchedSeconds,
        totalDuration: newTotalDuration,
        percentage: Math.min(percentage, 100),
        lastPosition: lastPosition,
        lastUpdated: Date.now()
      };
    }
  }
});

export const { updateVideoProgress } = videoProgressSlice.actions;
export default videoProgressSlice.reducer;