import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          headerShown: false,
          title: "Change Password",
      }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          headerShown: false,
          title: "Notification Settings",
      }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          headerShown: false,
          title: "Favorites",
        }}
      />
      <Stack.Screen
        name="more"
        options={{
          headerShown: false,
          title: "More",
        }}
      />
    </Stack>
  );
}
