import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateVideoProgress } from "../../redux/VideoProgressSlice";

/**
 * Hook to manage video progress tracking and synchronization with Redux.
 * @param {string} videoId 
 * @param {object} videoRef Reference to the Video component
 * @returns {object} Progress state and handlers
 */
export const useVideoProgress = (videoId, videoRef) => {
    const dispatch = useDispatch();
    const savedProgress = useSelector(state => state.videoProgress.progressByVideo[videoId]);

    const lastPositionRef = useRef(0);
    const watchedMillisRef = useRef(0);
    const currentVideoIdRef = useRef(null);
    const hasInitializedFromReduxRef = useRef(false);

    const [localWatchedMillis, setLocalWatchedMillis] = useState(0);
    const [totalDurationMillis, setTotalDurationMillis] = useState(0);
    const [shouldResume, setShouldResume] = useState(true);

    // Initialize/Reset tracking when videoId changes
    useEffect(() => {
        if (currentVideoIdRef.current !== videoId) {
            currentVideoIdRef.current = videoId;
            hasInitializedFromReduxRef.current = false;

            watchedMillisRef.current = 0;
            setLocalWatchedMillis(0);
            setTotalDurationMillis(0);
            lastPositionRef.current = 0;
        }

        if (!hasInitializedFromReduxRef.current && savedProgress) {
            console.log(`[useVideoProgress] Initializing from Redux for ${videoId}: ${savedProgress.watchedSeconds}s`);
            watchedMillisRef.current = (savedProgress.watchedSeconds || 0) * 1000;
            setLocalWatchedMillis((savedProgress.watchedSeconds || 0) * 1000);
            setTotalDurationMillis((savedProgress.totalDuration || 0) * 1000);
            lastPositionRef.current = savedProgress.lastPosition || 0;
            hasInitializedFromReduxRef.current = true;
        }

        setShouldResume(true);
    }, [videoId, savedProgress]);
const onPlaybackStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) return;

    if (status.durationMillis) {
        setTotalDurationMillis(status.durationMillis);
    }

    let diff = status.positionMillis - lastPositionRef.current;

    // Ignore backward seek or large jumps
    if (diff < 0 || diff > 3000) {
        lastPositionRef.current = status.positionMillis;
        return;
    }

    // If video already completed, do not accumulate further progress
    const isCompleted = watchedMillisRef.current >= status.durationMillis;

    if (status.isPlaying) {
        if (!isCompleted) {
            watchedMillisRef.current += diff;
            setLocalWatchedMillis(watchedMillisRef.current);
        } else {
            // Keep it capped at full duration (100%)
            watchedMillisRef.current = status.durationMillis;
            setLocalWatchedMillis(status.durationMillis);
        }

        const currentSeconds = Math.floor(watchedMillisRef.current / 1000);
        const durationSeconds = Math.floor(status.durationMillis / 1000);
        const lastSavedSeconds = savedProgress?.watchedSeconds || 0;

        // Sync every 3 seconds
        if (currentSeconds > lastSavedSeconds + 3) {
            dispatch(updateVideoProgress({
                videoId,
                watchedSeconds: currentSeconds,
                totalDuration: durationSeconds,
                lastPosition: status.positionMillis
            }));
        }
    }

    if (status.didJustFinish) {
        const durationSeconds = Math.floor(status.durationMillis / 1000);

        // Mark fully completed
        watchedMillisRef.current = status.durationMillis;
        setLocalWatchedMillis(status.durationMillis);

        dispatch(updateVideoProgress({
            videoId,
            watchedSeconds: durationSeconds,
            totalDuration: durationSeconds,
            lastPosition: status.durationMillis
        }));
    }

    lastPositionRef.current = status.positionMillis;
}, [videoId, savedProgress, dispatch]);

    const onLoad = useCallback(() => {
        const targetPos = savedProgress?.lastPosition || 0;
        if (shouldResume && targetPos > 0) {
            videoRef.current?.setPositionAsync(targetPos);
        }
        setShouldResume(false);
    }, [shouldResume, savedProgress, videoRef]);

    const watchedPercentage = totalDurationMillis > 0
        ? ((localWatchedMillis / totalDurationMillis) * 100).toFixed(1)
        : 0;

    return {
        localWatchedMillis,
        totalDurationMillis,
        watchedPercentage,
        onPlaybackStatusUpdate,
        onLoad
    };
};
