// utils/DownloadManager.js
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

export async function downloadVideo(url, filename) {
  try {
    // 1️⃣ Request Media Library photo & video permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Please allow media permission to download videos");
      return false;
    }

    // 2️⃣ Clean the filename
    const safeName =
      filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp4";

    // 3️⃣ Use apps document directory
    const fileUri = FileSystem.documentDirectory + safeName;

    // 4️⃣ Download using legacy API
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    console.log("Downloaded to:", uri);

    // 5️⃣ Save to media library
    const asset = await MediaLibrary.createAssetAsync(uri);

    // 6️⃣ Add to album or create one
    const album = await MediaLibrary.getAlbumAsync("MyDownloads");
    if (album == null) {
      await MediaLibrary.createAlbumAsync("MyDownloads", asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    console.log("✅ Video saved to gallery!");
    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
}
