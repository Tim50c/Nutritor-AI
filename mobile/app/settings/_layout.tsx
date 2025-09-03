import { Stack } from "expo-router";
import CustomHeader from "@/components/CustomHeader";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
          title: "Profile",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: "Change Password",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
      }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          title: "Notification Settings",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
      }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: "Favorites",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
      <Stack.Screen
        name="more"
        options={{
          title: "More",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
    </Stack>
  );
}
