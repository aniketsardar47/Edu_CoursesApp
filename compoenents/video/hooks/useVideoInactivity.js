import { useState, useRef, useCallback, useEffect } from "react";

export const useVideoInactivity = (videoRef) => {
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const isPlayingRef = useRef(false); // Track play state without triggering re-renders

  const clearTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    // Only start the countdown if the video is actually playing
    if (isPlayingRef.current) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
        videoRef.current?.pauseAsync();
      }, 5000);
    }
  }, [videoRef]);

  const resetIdleTimer = useCallback(() => {
    if (isIdle) {
      setIsIdle(false);
      videoRef.current?.playAsync();
      // startTimer will be triggered by the playback status update
    } else {
      startTimer();
    }
  }, [isIdle, startTimer, videoRef]);

  // This function will be called by your video's onPlaybackStatusUpdate
  const updatePlaybackStatus = useCallback((status) => {
    isPlayingRef.current = status.isPlaying;
    
    if (status.isPlaying) {
      // If video started playing and timer isn't running, start it
      if (!idleTimerRef.current) startTimer();
    } else {
      // If video paused manually, kill the timer
      clearTimer();
    }
  }, [startTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return { isIdle, resetIdleTimer, updatePlaybackStatus };
};