import * as FileSystem from "expo-file-system/legacy";

const TRANSLATION_FOLDER = FileSystem.documentDirectory + "Translations/";

const ensureDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(TRANSLATION_FOLDER);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(TRANSLATION_FOLDER, { intermediates: true });
    }
};

/**
 * Saves a translated description to local storage.
 * @param {string} videoId 
 * @param {string} lang e.g., 'en', 'hi', 'mr'
 * @param {string} text 
 */
export const saveTranslation = async (videoId, lang, text) => {
    try {
        await ensureDirectory();
        const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
        await FileSystem.writeAsStringAsync(filePath, text);
        console.log(`[OfflineTranslationStore] Saved ${lang} for ${videoId}`);
        return true;
    } catch (e) {
        console.error(`[OfflineTranslationStore] Save failed:`, e);
        return false;
    }
};

/**
 * Retrieves a translated description from local storage.
 * @param {string} videoId 
 * @param {string} lang 
 */
export const getTranslation = async (videoId, lang) => {
    try {
        const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            const text = await FileSystem.readAsStringAsync(filePath);
            return text;
        }
        return null;
    } catch (e) {
        console.error(`[OfflineTranslationStore] Retrieval failed:`, e);
        return null;
    }
};

/**
 * Checks if a translation exists locally.
 */
export const hasTranslation = async (videoId, lang) => {
    const filePath = `${TRANSLATION_FOLDER}${videoId}_${lang}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
};
