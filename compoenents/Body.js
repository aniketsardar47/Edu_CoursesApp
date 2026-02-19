import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomePage from "./HomePage";
import CourseScreen from "./CourseScreen";
import VideoPlayerScreen from "./VideoPlayerScreen";
import MyDownloads from "./MyDownloads"; // ✅ Make sure this file exists
import VideoPlayer from "./video/VideoPlayer"; // ✅ Make sure this file exists
import QuizScreen from "./video/QuizScreen";
const Stack = createNativeStackNavigator();

export default function Body() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="CourseScreen" component={CourseScreen} />
        <Stack.Screen name="VideoPlayerScreen" component={VideoPlayerScreen} /> 
        <Stack.Screen name="MyDownloads" component={MyDownloads} /> 
        <Stack.Screen name="VideoPlayer" component={VideoPlayer} /> 
        <Stack.Screen name="QuizScreen" component={QuizScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
