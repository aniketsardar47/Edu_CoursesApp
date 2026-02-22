import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const VideoAttachmentsList = ({ attachments, onOpen, onDownload }) => {
    if (!Array.isArray(attachments) || attachments.length === 0) return null;

    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="attach-outline" size={18} color="#bb86fc" />
                <Text style={styles.sectionTitle}>ATTACHMENTS</Text>
            </View>

            {attachments.map((f, index) => (
                <View key={f._id} style={[
                    styles.attachmentItem,
                    index < attachments.length - 1 && styles.attachmentBorder
                ]}>
                    <View style={styles.attachmentIcon}>
                        <Ionicons
                            name={f.fileType === 'pdf' ? 'document-pdf' : 'document'}
                            size={24}
                            color="#bb86fc"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.attachmentContent}
                        onPress={() => onOpen(f.downloadUrl)}
                    >
                        <Text style={styles.attachmentName} numberOfLines={1}>
                            {f.fileName}
                        </Text>
                        <Text style={styles.attachmentMeta}>
                            {f.fileType.toUpperCase()} • {f.size.toFixed(2)} MB
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.attachmentDownload}
                        onPress={() => onDownload(f.downloadUrl, f.fileName)}
                    >
                        <Ionicons name="download" size={20} color="#bb86fc" />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: '#111111',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        color: '#bb86fc',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
        letterSpacing: 1.2,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    attachmentBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    attachmentIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(187, 134, 252, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attachmentContent: {
        flex: 1,
    },
    attachmentName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    attachmentMeta: {
        color: '#888',
        fontSize: 11,
        fontWeight: '500',
    },
    attachmentDownload: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VideoAttachmentsList;
