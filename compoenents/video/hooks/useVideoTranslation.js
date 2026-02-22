import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { saveTranslation, getTranslation } from "../../utils/OfflineTranslationStore";

/**
 * Hook to manage video description translations and caching.
 * @param {string} videoId 
 * @param {object} videoData 
 * @param {boolean} isConnected 
 * @param {boolean} forceOffline
 * @param {function} normalizeUrl 
 * @returns {object} Translation state and handlers
 */
export const useVideoTranslation = (videoId, videoData, isConnected, forceOffline, normalizeUrl) => {
    const effectiveConnected = isConnected && !forceOffline;
    const [descriptionText, setDescriptionText] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [originalText, setOriginalText] = useState("");
    const [translating, setTranslating] = useState(false);
    const [loadingDescription, setLoadingDescription] = useState(false);
    const [isOfflineCache, setIsOfflineCache] = useState(false);

    // Fetch initial description (English)
    useEffect(() => {
        const fetchInitialDescription = async () => {
            if (forceOffline) {
                try {
                    setLoadingDescription(true);
                    const cachedText = await getTranslation(videoId, "en");
                    if (cachedText) {
                        setDescriptionText(cachedText);
                        setOriginalText(cachedText);
                        setSelectedLanguage("en");
                        setIsOfflineCache(true);
                    } else {
                        setDescriptionText("Description not available in offline cache.");
                    }
                } catch (error) {
                    console.error("[useVideoTranslation] Error loading offline english:", error);
                    setDescriptionText("Description not available.");
                } finally {
                    setLoadingDescription(false);
                }
                return;
            }

            // Online fetch
            if (!videoData?.descriptionUrls?.english) {
                if (videoData?.descriptionUrl) {
                    try {
                        setLoadingDescription(true);
                        const targetUrl = normalizeUrl(videoData.descriptionUrl);
                        const response = await fetch(targetUrl);
                        const text = await response.text();
                        setDescriptionText(text);
                        setOriginalText(text);
                        setIsOfflineCache(false);
                    } catch (error) {
                        console.error("[useVideoTranslation] Error fetching legacy description:", error);
                    } finally {
                        setLoadingDescription(false);
                    }
                }
                return;
            }

            try {
                setLoadingDescription(true);
                const targetUrl = normalizeUrl(videoData.descriptionUrls.english);
                const response = await fetch(targetUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const text = await response.text();
                setDescriptionText(text);
                setOriginalText(text);
                setSelectedLanguage("en");
                setIsOfflineCache(false);

                // Save initial english to cache as well
                await saveTranslation(videoId, "en", text);
            } catch (error) {
                console.error("[useVideoTranslation] Error fetching description:", error);
                setDescriptionText("Description not available.");
            } finally {
                setLoadingDescription(false);
            }
        };

        fetchInitialDescription();
    }, [videoId, videoData?.descriptionUrls?.english, videoData?.descriptionUrl, forceOffline, normalizeUrl]);

    const translateDescription = useCallback(async (targetLang) => {
        if (!videoData?.descriptionUrls) {
            if (!originalText) return;

            const languageMap = {
                en: "English",
                hi: "Hindi",
                mr: "Marathi",
                te: "Telugu",
                ta: "Tamil",
            };

            if (targetLang === "en") {
                setDescriptionText(originalText);
                setIsOfflineCache(false);
                return;
            }

            try {
                setTranslating(true);
                const response = await fetch(
                    "http://10.197.15.102:7777/api/translate/translate",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            text: originalText,
                            target: languageMap[targetLang],
                        }),
                    }
                );
                const data = await response.json();
                if (data.translatedText) {
                    setDescriptionText(data.translatedText);
                    setIsOfflineCache(false);
                } else {
                    Alert.alert("Translation failed");
                }
            } catch (error) {
                console.error("[useVideoTranslation] Legacy Translation Error:", error);
                Alert.alert("Translation Failed");
            } finally {
                setTranslating(false);
            }
            return;
        }

        const languageMap = {
            en: "english",
            hi: "hindi",
            mr: "marathi",
            te: "telugu",
            ta: "tamil",
        };

        const targetKey = languageMap[targetLang];
        const targetUrl = videoData.descriptionUrls[targetKey];

        if (!targetUrl) {
            Alert.alert("Error", "Translation file not found for this language.");
            return;
        }

        try {
            setTranslating(true);
            setIsOfflineCache(false);

            if (!forceOffline) {
                const normalizedTargetUrl = normalizeUrl(targetUrl);
                const response = await fetch(normalizedTargetUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const text = await response.text();

                if (text) {
                    setDescriptionText(text);
                    await saveTranslation(videoId, targetLang, text);
                } else {
                    Alert.alert("Error", "Translation file is empty.");
                }
            } else {
                const cachedText = await getTranslation(videoId, targetLang);
                if (cachedText) {
                    setDescriptionText(cachedText);
                    setIsOfflineCache(true);
                } else {
                    Alert.alert("Offline Mode", "This translation is not available offline.");
                }
            }
        } catch (error) {
            console.error("[useVideoTranslation] Fetch Error:", error);
            if (!forceOffline) {
                Alert.alert(
                    "Network Error",
                    "Could not fetch translation online. Please switch to Offline mode if you have downloaded it."
                );
            } else {
                Alert.alert("Failed", "Could not load the translated description.");
            }
        } finally {
            setTranslating(false);
        }
    }, [videoId, videoData, forceOffline, originalText, normalizeUrl]);

    // Re-translate automatically when the manual offline mode is toggled by the user
    useEffect(() => {
        if (originalText || videoData?.descriptionUrls) {
            translateDescription(selectedLanguage);
        }
    }, [forceOffline]); // Intentionally only depend on forceOffline to avoid loops

    return {
        descriptionText,
        selectedLanguage,
        setSelectedLanguage,
        translating,
        loadingDescription,
        isOfflineCache,
        translateDescription
    };
};
