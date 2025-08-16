import {Stack} from "expo-router";
import "./global.css";
import {StatusBar} from "expo-status-bar";
import CustomHeader from "@/components/CustomHeader";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider } from "@/context/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <NotificationProvider>
        <StatusBar style="auto"/>
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              title: "Notifications",
              header: ({ options }) => (
                <CustomHeader title={options.title || ""} />
              ),
            }}
          />
        </Stack>
      </NotificationProvider>
    </UserProvider>
  );
}
