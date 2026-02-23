import * as Speech from "expo-speech";

export const speakEnglishText = async (text) => {
  if (!text) return;
  

  try {
    const currentlySpeaking = await Speech.isSpeakingAsync();

    if (currentlySpeaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.95,
      volume: 1.0,
    });

  } catch (error) {
    console.log("TTS Error:", error);
  }
};

export const stopSpeech = async () => {
  await Speech.stop();
};