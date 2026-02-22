import React from "react";
import { Text, StyleSheet } from "react-native";

/**
 * Utility to render text with bold highlights between asterisks.
 * @param {string} text 
 * @returns {Array} Array of Text components
 */
export const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") ? (
            <Text key={index} style={styles.boldHighlight}>{part.slice(1, -1)}</Text>
        ) : (
            <Text key={index} style={styles.normalText}>{part}</Text>
        )
    );
};

const styles = StyleSheet.create({
    boldHighlight: {
        fontWeight: 'bold',
        color: '#bb86fc', // Or any highlight color
    },
    normalText: {
        color: '#e0e0e0',
    },
});
