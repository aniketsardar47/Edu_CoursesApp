import { useState, useEffect } from "react";
import * as Battery from "expo-battery";
import NetInfo from "@react-native-community/netinfo";
import useRealtimeSpeed from "../useRealtimeSpeed";

/**
 * Hook to manage video metadata, connectivity, battery status, and network speed.
 * @param {string} courseId 
 * @param {string} videoId 
 * @param {boolean} isAutoQuality
 * @returns {object} Metadata state
 */
export const useVideoMetadata = (courseId, videoId, isAutoQuality = true) => {
    const [videoData, setVideoData] = useState(null);
    const [batterySaverOn, setBatterySaverOn] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    const rawSpeed = useRealtimeSpeed(isAutoQuality ? 10000 : null) ?? 0;
    const speed = batterySaverOn ? 0 : rawSpeed;

    // Fetch Video Data
    useEffect(() => {
        if (!courseId || !videoId) return;
        const apiUrl = `http://10.107.25.116:7777/api/videos/course/${courseId}/${videoId}`;
        console.log(`[useVideoMetadata] Fetching video data: ${apiUrl}`);
        fetch(apiUrl)
            .then((res) => res.json())
            .then(setVideoData)
            .catch((err) => console.error("[useVideoMetadata] Fetch error:", err));
    }, [courseId, videoId]);

    // Battery Monitoring
    useEffect(() => {
        Battery.getBatteryLevelAsync().then((level) => {
            const percent = Math.round(level * 100);
            setBatterySaverOn(percent <= 20);
        });

        const sub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            const percent = Math.round(batteryLevel * 100);
            setBatterySaverOn(percent <= 20);
        });

        return () => sub.remove();
    }, []);

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
            console.log(`[useVideoMetadata] Connectivity: ${state.isConnected ? 'ONLINE' : 'OFFLINE'}`);
        });

        return () => unsubscribe();
    }, []);

    return {
        videoData,
        batterySaverOn,
        speed,
        isConnected
    };
};
