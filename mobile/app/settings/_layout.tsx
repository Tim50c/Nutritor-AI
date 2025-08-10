// app/settings/_layout.tsx
import { Stack } from "expo-router";
import CustomHeader from "@/components/CustomHeader";


export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => (
          <CustomHeader title={options.title || ""} />
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="change-password"
        options={{ title: "Change Password" }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{ title: "Notification Settings" }}
      />
      <Stack.Screen
        name="favorites"
        options={{ title: "Favorites" }}
      />
      <Stack.Screen
        name="more"
        options={{ title: "More" }}
      />
    </Stack>
  );
}
