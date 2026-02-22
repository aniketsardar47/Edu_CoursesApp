import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const VideoProgressCard = ({ watchedPercentage, localWatchedMillis, totalDurationMillis }) => {
    const isCompleted = Number(watchedPercentage) >= 99;

    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="analytics-outline" size={18} color="#bb86fc" />
                <Text style={styles.sectionTitle}>LEARNING PROGRESS</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.learningProgressBarBg}>
                    <View
                        style={[
                            styles.learningProgressBarFill,
                            {
                                width: `${watchedPercentage}%`
                            }
                        ]}
                    />
                </View>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                        {Math.round(watchedPercentage)}% Completed
                    </Text>
                    <Text style={styles.progressText}>
                        {Math.floor(localWatchedMillis / 1000)}s / {Math.floor(totalDurationMillis / 1000)}s
                    </Text>
                </View>
            </View>

            {isCompleted && (
                <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                    <Text style={styles.completedText}>Lesson Completed</Text>
                </View>
            )}
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
    progressContainer: {
        marginBottom: 10,
    },
    learningProgressBarBg: {
        height: 8,
        backgroundColor: '#222',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    learningProgressBarFill: {
        height: '100%',
        backgroundColor: "#bb86fc",
        opacity: 0.8,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    completedText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default VideoProgressCard;
