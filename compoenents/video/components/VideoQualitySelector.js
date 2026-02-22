import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const VideoQualitySelector = ({ quality, setQuality, speed, batterySaverOn }) => {
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="settings-outline" size={18} color="#bb86fc" />
                <Text style={styles.sectionTitle}>VIDEO QUALITY</Text>
            </View>

            <View style={styles.qualityContainer}>
                {["Auto", "240p", "360p", "720p"].map((q) => (
                    <TouchableOpacity
                        key={q}
                        style={[
                            styles.qualityOption,
                            quality === q && styles.activeQuality,
                            batterySaverOn && styles.disabledQuality,
                        ]}
                        onPress={() => setQuality(q)}
                        disabled={batterySaverOn}
                    >
                        {quality === q && (
                            <View style={styles.qualityIndicator}>
                                <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                        )}
                        <Text style={[
                            styles.qualityText,
                            quality === q && styles.activeQualityText
                        ]}>
                            {q}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Speed Information */}
            <View style={styles.speedContainer}>
                <View style={styles.speedIconContainer}>
                    <Ionicons name="speedometer-outline" size={20} color="#bb86fc" />
                </View>
                <View style={styles.speedInfo}>
                    <Text style={styles.speedLabel}>Network Speed</Text>
                    <Text style={styles.speedValue}>{Math.round(speed * 100)} kbps</Text>
                </View>
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
    qualityContainer: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: 12,
        padding: 4,
        marginBottom: 15,
    },
    qualityOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        position: 'relative',
    },
    activeQuality: {
        backgroundColor: '#7c3aed',
    },
    disabledQuality: {
        opacity: 0.4,
    },
    qualityText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '600',
    },
    activeQualityText: {
        color: '#fff',
    },
    qualityIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#9d4edd',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#111',
    },
    speedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    speedIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(187, 134, 252, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    speedInfo: {
        flex: 1,
    },
    speedLabel: {
        color: '#888',
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 2,
    },
    speedValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default VideoQualitySelector;
