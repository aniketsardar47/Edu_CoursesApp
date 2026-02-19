import React, { createContext, useContext, useEffect, useState } from "react";
import * as Battery from "expo-battery";

const BatteryContext = createContext();

export const BatteryProvider = ({ children }) => {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [systemLowPowerMode, setSystemLowPowerMode] = useState(false);
  const [manualBatterySaver, setManualBatterySaver] = useState(false);

  // Detect system battery level + low power mode
  useEffect(() => {
    Battery.getBatteryLevelAsync().then((level) => {
      setBatteryLevel(Math.round(level * 100));
    });

    Battery.isLowPowerModeEnabledAsync().then((enabled) => {
      setSystemLowPowerMode(enabled);
    });

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(Math.round(batteryLevel * 100));
    });

    const powerSub = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
      setSystemLowPowerMode(lowPowerMode);
    });

    return () => {
      levelSub.remove();
      powerSub.remove();
    };
  }, []);

  // Final Battery Saver Logic
  const isBatterySaverOn =
    manualBatterySaver || systemLowPowerMode || batteryLevel <= 20;

  return (
    <BatteryContext.Provider
      value={{
        batteryLevel,
        isBatterySaverOn,
        manualBatterySaver,
        setManualBatterySaver,
      }}
    >
      {children}
    </BatteryContext.Provider>
  );
};

export const useBatteryContext = () => useContext(BatteryContext);
