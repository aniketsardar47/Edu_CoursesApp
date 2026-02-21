import * as FileSystem from "expo-file-system/legacy";

const DOWNLOAD_FOLDER = FileSystem.documentDirectory + "CourseDownloads/";

// Ensure the directory exists
const ensureDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_FOLDER);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_FOLDER, { intermediates: true });
  }
};

export const encryptFile = async (inputUri, filename) => {
  try {
    await ensureDirectory();
    // Use the exact filename provided + .dat
    const destination = DOWNLOAD_FOLDER + filename + ".dat";

    await FileSystem.moveAsync({
      from: inputUri,
      to: destination,
    });

    console.log("File masked at:", destination);
    return destination;
  } catch (e) {
    console.error("Masking failed:", e);
    return null;
  }
};

export const decryptFile = async (uri) => {
  try {
    // 1. Extract filename from the URI
    const fileName = uri.split('/').pop();
    
    // 2. Build the path using our dedicated folder to ensure it exists
    const currentValidPath = DOWNLOAD_FOLDER + fileName;
    
    const fileCheck = await FileSystem.getInfoAsync(currentValidPath);
    if (!fileCheck.exists) {
      throw new Error("Physical file not found in CourseDownloads");
    }

    // 3. Create a temporary playable copy
    const tempUri = currentValidPath.replace(".dat", "_temp.mp4");
    await FileSystem.copyAsync({
      from: currentValidPath,
      to: tempUri,
    });

    return tempUri;
  } catch (e) {
    console.error("Restoration failed:", e);
    return null;
  }
};

export async function downloadVideo(url, filename) {
  try {
    await ensureDirectory();
    const tempInternalUri = FileSystem.cacheDirectory + filename + ".mp4";

    const result = await FileSystem.downloadAsync(url, tempInternalUri);

    if (result.status !== 200) throw new Error("Download failed");

    // Secure the file into the CourseDownloads folder
    return await encryptFile(result.uri, filename);
  } catch (e) {
    console.error("Download error:", e);
    return null;
  }
}

export const createDownloadResumable = (url, filename, progressCallback) => {
  // Download initially to cache, then we will move it in handleDownloadAction
  const internalUri = FileSystem.cacheDirectory + filename + ".mp4";

  return FileSystem.createDownloadResumable(
    url,
    internalUri,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      progressCallback(progress);
    }
  );
};