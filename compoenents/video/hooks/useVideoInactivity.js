import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Hook to manage video inactivity (blur and auto-pause).
 * @param {object} videoRef Reference to the Expo AV Video component
 * @returns {object} { isIdle, setIsIdle, resetIdleTimer }
 */
export const useVideoInactivity = (videoRef) => {
    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef(null);
    const pauseTimerRef = useRef(null);

    const resetIdleTimer = useCallback(() => {
        // If it was blurred, remove blur and play
        if (isIdle) {
            setIsIdle(false);
            videoRef.current?.playAsync();
        }

        // Clear existing timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

        // Set new timer for 3 minutes (180,000ms) to trigger Blur
        idleTimerRef.current = setTimeout(() => {
            handleInactivity();
        }, 10000);
    }, [isIdle, videoRef]);

    const handleInactivity = useCallback(() => {
        setIsIdle(true);
        console.log("[useVideoInactivity] Inactivity detected: Blur activated.");

        // Clear any existing pause timer just in case
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

        // Set a secondary timer for 2 minutes (120,000ms) to Pause the video
        pauseTimerRef.current = setTimeout(() => {
            console.log("[useVideoInactivity] Continuous inactivity: Pausing video.");
            videoRef.current?.pauseAsync();
        }, 120000);
    }, [videoRef]);

    // Initialize timer on mount
    useEffect(() => {
        resetIdleTimer();
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        };
    }, [resetIdleTimer]);

    return { isIdle, setIsIdle, resetIdleTimer };
};
