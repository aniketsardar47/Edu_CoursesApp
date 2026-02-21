// src/redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import downloadReducer from './DownloadSlice';
import videoProgressReducer from './VideoProgressSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['downloads', 'videoProgress'], 
};

const rootReducer = combineReducers({
  downloads: downloadReducer,
  videoProgress: videoProgressReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ✅ Make sure this is exported
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// ✅ Make sure this is exported
export const persistor = persistStore(store);