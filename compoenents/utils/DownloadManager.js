import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

export async function downloadVideo(url, filename) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return null;

    const safeName =
      filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp4";

    const internalUri = FileSystem.documentDirectory + safeName;

    const result = await FileSystem.downloadAsync(url, internalUri);

    const info = await FileSystem.getInfoAsync(result.uri);
    if (!info.exists || info.size < 100000) {
      throw new Error("Invalid video file");
    }

    // Save to gallery
    const asset = await MediaLibrary.createAssetAsync(result.uri);

    // Copy to cache for sharing
    const shareUri = FileSystem.cacheDirectory + safeName;
    await FileSystem.copyAsync({ from: result.uri, to: shareUri });

    return shareUri;
  } catch (e) {
    console.error("Download error:", e);
    return null;
  }
}
