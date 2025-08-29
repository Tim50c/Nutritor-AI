import {Stack} from "expo-router";
import "./global.css";
import {StatusBar} from "expo-status-bar";
import CustomHeader from "@/components/CustomHeader";
import {NotificationProvider} from "@/context/NotificationContext";
import {UserProvider} from "@/context/UserContext";
import {DietProvider} from "@/context/DietContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <DietProvider>
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
                header: ({options}) => (
                  <CustomHeader title={options.title || ""}/>
                ),
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                title: "Search",
                header: ({options}) => (
                  <CustomHeader title={options.title || ""}/>
                )
              }}
            />
          </Stack>
        </NotificationProvider>
      </DietProvider>
    </UserProvider>
  );
}
