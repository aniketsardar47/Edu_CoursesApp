import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

const QuizScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { quiz, videoTitle } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const currentQuestion = quiz[currentIndex];

  const handleNext = () => {
    if (selected === null) {
      Alert.alert("Select an option");
      return;
    }

    if (selected === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setSelected(null);

    if (currentIndex + 1 < quiz.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert(
        "Quiz Finished 🎉",
        `Score: ${score + (selected === currentQuestion.correctAnswer ? 1 : 0)} / ${quiz.length}`,
        [
          {
            text: "Back to Video",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{videoTitle}</Text>
      <Text style={styles.question}>
        Q{currentIndex + 1}. {currentQuestion.question}
      </Text>

      {currentQuestion.options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.option,
            selected === idx && styles.selectedOption,
          ]}
          onPress={() => setSelected(idx)}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>
          {currentIndex + 1 === quiz.length ? "Finish" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuizScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0a1929",
  },
  title: {
    color: "#60a5fa",
    fontSize: 18,
    marginBottom: 10,
  },
  question: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
  option: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: "#2563eb",
  },
  optionText: {
    color: "#fff",
  },
  nextBtn: {
    marginTop: 20,
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  nextBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
