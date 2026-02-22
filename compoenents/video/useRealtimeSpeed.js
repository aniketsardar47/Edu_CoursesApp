import { useEffect, useState } from "react";

/**
 * Measures realtime internet speed (Mbps)
 * @param interval - how often to test (ms)
 */
const useRealtimeSpeed = (interval = 3000) => {
  const [speed, setSpeed] = useState(null);

  useEffect(() => {
    if (!interval) return;

    let isMounted = true;

    const testSpeed = async () => {
      try {
        const startTime = Date.now();

        const response = await fetch(
          "https://speed.cloudflare.com/__down?bytes=500000"
        );

        const blob = await response.blob();
        const endTime = Date.now();

        const duration = (endTime - startTime) / 1000;
        const bitsLoaded = blob.size * 8;
        const mbps = (bitsLoaded / duration) / (1024 * 1024);

        if (isMounted) {
          setSpeed(Number(mbps.toFixed(2)));
        }
      } catch (err) {
        console.log("Speed test failed:", err);
      }
    };

    testSpeed();
    const timer = setInterval(testSpeed, interval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [interval]);

  return speed;
};

export default useRealtimeSpeed;
