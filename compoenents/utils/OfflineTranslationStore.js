import * as FileSystem from "expo-file-system/legacy";

const TRANSLATION_FOLDER = FileSystem.documentDirectory + "Translations/";

const ensureDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(TRANSLATION_FOLDER);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(TRANSLATION_FOLDER, { intermediates: true });
    }
};

/**
 * Saves translated description locally (per video & language)
 */
export const saveTranslation = async (videoId, lang, text) => {
    try {
        await ensureDirectory();
        const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
        await FileSystem.writeAsStringAsync(filePath, text);
        return true;
    } catch (e) {
        console.error(`[OfflineTranslationStore] Save failed:`, e);
        return false;
    }
};

/**
 * Gets cached translation
 */
export const getTranslation = async (videoId, lang) => {
    try {
        const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists) {
            return await FileSystem.readAsStringAsync(filePath);
        }

        return null;
    } catch (e) {
        console.error(`[OfflineTranslationStore] Retrieval failed:`, e);
        return null;
    }
};

/**
 * Check if translation exists
 */
export const hasTranslation = async (videoId, lang) => {
    const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
};