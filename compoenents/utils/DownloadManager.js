import * as FileSystem from "expo-file-system/legacy";

export async function downloadVideo(url, filename) {
  try {
    // 1. Create a safe filename
    const safeName = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp4";
    
    // 2. Set the destination to the App's private Document Directory
    // This folder is persistent and doesn't trigger the "External Storage" error
    const internalUri = FileSystem.documentDirectory + safeName;

    console.log("Downloading to:", internalUri);

    // 3. Start download
    const result = await FileSystem.downloadAsync(url, internalUri);

    // 4. Validate file
    const info = await FileSystem.getInfoAsync(result.uri);
    if (!info.exists || info.size < 1000) { // Check if file is valid
      throw new Error("File download incomplete or invalid");
    }

    // Return the internal URI to be stored in Redux
    return result.uri; 

  } catch (e) {
    console.error("Download error:", e);
    return null;
  }
}