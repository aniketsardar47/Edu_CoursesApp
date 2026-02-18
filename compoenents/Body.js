import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomePage from "./HomePage";
import VideoPlayer from "./video/VideoPlayer";
import CourseScreen from "./CourseScreen";
import VideoPlayerScreen from "./VideoPlayerScreen";
const Stack = createNativeStackNavigator();

export default function Body() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayer} />
        <Stack.Screen name="CourseScreen" component={CourseScreen} />
        <Stack.Screen
          name="VideoPlayerScreen"
          component={VideoPlayerScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
