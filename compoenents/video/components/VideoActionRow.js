import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const VideoActionRow = ({
    isDownloading,
    downloadProgress,
    onDownload,
    localUri,
    onShare
}) => {
    return (
        <View style={styles.actionRow}>
            <TouchableOpacity
                style={[styles.actionBtn, isDownloading && styles.disabledBtn]}
                onPress={onDownload}
                disabled={isDownloading}
            >
                <View style={[styles.actionContent, styles.downloadBtn]}>
                    {isDownloading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="download-outline" size={22} color="#fff" />
                    )}
                    <Text style={styles.actionText}>
                        {isDownloading ? `${Math.round(downloadProgress * 100)}%` : "Download"}
                    </Text>
                </View>

                {/* Progress Bar Background */}
                {isDownloading && (
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionBtn, !localUri && styles.disabledBtn]}
                onPress={onShare}
                disabled={!localUri || isDownloading}
            >
                <View style={[styles.actionContent, !localUri ? styles.disabledShareBtn : styles.shareBtn]}>
                    <Ionicons name="share-social-outline" size={22} color="#fff" />
                    <Text style={styles.actionText}>Share</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 20,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 54,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },
    actionContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    downloadBtn: {
        backgroundColor: '#7c3aed',
    },
    shareBtn: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    disabledShareBtn: {
        backgroundColor: '#111',
        opacity: 0.5,
    },
    actionText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#fff',
    },
    disabledBtn: {
        opacity: 0.8,
    },
});

export default VideoActionRow;
