import { useEffect, useState } from "react";
import * as Battery from "expo-battery";

export default function useBatterySaver() {
  const [isBatterySaverOn, setIsBatterySaverOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    // Get battery level (0.0 – 1.0)
    Battery.getBatteryLevelAsync().then((level) => {
      setBatteryLevel(Math.round(level * 100));
    });

    // Get battery saver / low power mode status
    Battery.isLowPowerModeEnabledAsync().then((enabled) => {
      setIsBatterySaverOn(enabled);
    });

    // Listen for changes
    const batteryLevelSub =
      Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setBatteryLevel(Math.round(batteryLevel * 100));
      });

    const powerModeSub =
      Battery.addLowPowerModeListener(({ lowPowerMode }) => {
        setIsBatterySaverOn(lowPowerMode);
      });

    return () => {
      batteryLevelSub.remove();
      powerModeSub.remove();
    };
  }, []);

  return { isBatterySaverOn, batteryLevel };
}
