import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { renderFormattedText } from "../utils/FormattingUtils";

const VideoDescriptionSection = ({
    selectedLanguage,
    setSelectedLanguage,
    descriptionText,
    translating,
    loadingDescription,
    isOfflineCache,
    onTranslate,
    onSpeak,
    onShowFullDesc
}) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="language-outline" size={18} color="#bb86fc" />
                <Text style={styles.sectionTitle}>DESCRIPTION & TRANSLATION</Text>
                {isOfflineCache && (
                    <View style={styles.cacheIndicator}>
                        <Ionicons name="cloud-offline" size={12} color="#4ade80" />
                        <Text style={styles.cacheText}>Offline Cache</Text>
                    </View>
                )}

                {/* <TouchableOpacity
                    style={[styles.offlineToggle, isManualOffline && styles.offlineToggleActive]}
                    onPress={() => setIsManualOffline(!isManualOffline)}
                >
                    <Ionicons
                        name={isManualOffline ? "cloud-offline" : "wifi"}
                        size={14}
                        color={isManualOffline ? "#ff4444" : "#4ade80"}
                    />
                    <Text style={[styles.offlineToggleText, isManualOffline && styles.offlineToggleTextActive]}>
                        {isManualOffline ? "Mode: Offline" : "Mode: Online"}
                    </Text>
                </TouchableOpacity> */}
            </View>

            {/* Simplified Language Picker as a Display Card */}
            <TouchableOpacity
                style={styles.languageDisplayCard}
                onPress={() => { }} // Logic handled by Picker below
            >
                <Text style={styles.selectedLanguageText}>
                    {selectedLanguage === "en" ? "English" :
                        selectedLanguage === "hi" ? "Hindi" :
                            selectedLanguage === "mr" ? "Marathi" :
                                selectedLanguage === "te" ? "Telugu" : "Tamil"}
                </Text>

                <View style={styles.pickerOverlayContainer}>
                    <Picker
                        selectedValue={selectedLanguage}
                        onValueChange={(itemValue) => {
                            setSelectedLanguage(itemValue);
                            onTranslate(itemValue);
                        }}
                        dropdownIconColor="#bb86fc"
                        style={styles.hiddenPicker}
                    >
                        <Picker.Item label="English" value="en" />
                        <Picker.Item label="Hindi" value="hi" />
                        <Picker.Item label="Marathi" value="mr" />
                        <Picker.Item label="Telugu" value="te" />
                        <Picker.Item label="Tamil" value="ta" />
                    </Picker>
                </View>
            </TouchableOpacity>

            <View style={styles.descriptionContainer}>
                {loadingDescription || translating ? (
                    <ActivityIndicator size="small" color="#bb86fc" />
                ) : (
                    <>
                        <Text numberOfLines={5} style={styles.descriptionText}>
                            {renderFormattedText(descriptionText) || "No description available."}
                        </Text>
                        {descriptionText && descriptionText.length > 200 && (
                            <TouchableOpacity onPress={onShowFullDesc} style={styles.readMoreBtn}>
                                <Text style={styles.readMoreText}>Read More</Text>
                                <Ionicons name="arrow-forward" size={16} color="#bb86fc" />
                            </TouchableOpacity>
                        )}

                        {selectedLanguage === "en" && descriptionText && (
                            <TouchableOpacity style={styles.speakBtn} onPress={onSpeak}>
                                <Ionicons name="volume-high-outline" size={20} color="#bb86fc" />
                                <Text style={styles.speakText}>Listen to Description</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
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
    cacheIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 'auto',
        gap: 4,
    },
    cacheText: {
        color: '#4ade80',
        fontSize: 10,
        fontWeight: 'bold',
    },
    languageDisplayCard: {
        backgroundColor: "#000",
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#222",
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    selectedLanguageText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "500",
    },
    pickerOverlayContainer: {
        position: 'absolute',
        right: 10,
        top: 0,
        bottom: 0,
        width: 50,
        justifyContent: 'center',
    },
    hiddenPicker: {
        width: '100%',
        color: 'transparent',
        opacity: 1,
    },
    descriptionContainer: {
        backgroundColor: '#000',
        borderRadius: 12,
        padding: 15,
        minHeight: 100,
    },
    descriptionText: {
        color: '#e0e0e0',
        fontSize: 14,
        lineHeight: 22,
    },
    readMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 4,
    },
    readMoreText: {
        color: '#bb86fc',
        fontSize: 13,
        fontWeight: '600',
    },
    speakBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#222',
        gap: 8,
    },
    speakText: {
        color: '#bb86fc',
        fontSize: 13,
        fontWeight: '500',
    },
});

export default VideoDescriptionSection;
