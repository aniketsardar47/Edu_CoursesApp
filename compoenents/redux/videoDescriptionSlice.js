import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch description from backend
export const fetchVideoDescription = createAsyncThunk(
  "videoDescription/fetch",
  async ({ videoId, language }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `https://your-api.com/api/videos/${videoId}/description?language=${language}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch description");
      }

      const data = await response.json();

      return {
        videoId,
        language,
        description: data.description
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const videoDescriptionSlice = createSlice({
  name: "videoDescription",
  initialState: {
    descriptions: {}, // { videoId: { en: "...", hi: "..." } }
    loading: false,
    error: null
  },
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchVideoDescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchVideoDescription.fulfilled, (state, action) => {
        state.loading = false;

        const { videoId, language, description } = action.payload;

        if (!state.descriptions[videoId]) {
          state.descriptions[videoId] = {};
        }

        state.descriptions[videoId][language] = description;
      })

      .addCase(fetchVideoDescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default videoDescriptionSlice.reducer;