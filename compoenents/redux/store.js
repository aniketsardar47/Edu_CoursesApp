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

const resettableRootReducer = (state, action) => {
  if (action.type === 'RESET_APP') {
    // This will reset all reducers to their initial state
    return rootReducer(undefined, action);
  }

  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: undefined,
    };
  }

  return rootReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, resettableRootReducer);

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