import { icons } from "@/constants/icons";
import { useIsDark } from "@/theme/useIsDark";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { SvgProps } from "react-native-svg";

function TabIcon({
  Icon,
  focused,
}: {
  Icon: React.FC<SvgProps>;
  focused: boolean;
}) {
  return (
    <View
      className={`p-2 ${focused ? "bg-gray-200 dark:bg-gray-700 rounded-xl" : ""}`}
    >
      <Icon width={32} height={32} />
    </View>
  );
}

function CameraTabIcon() {
  const isDark = useIsDark();

  return (
    <View
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10, // For Android
      }}
      className="absolute -top-10 bg-primary-200 dark:bg-primary-300 rounded-2xl border-2 border-white dark:border-black"
    >
      {isDark ? (
        <icons.cameraDark width={64} height={64} />
      ) : (
        <icons.camera width={64} height={64} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const isDark = useIsDark();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#3A3A3C" : "#E5E7EB",
          height: 65,
          paddingBottom: 5,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              Icon={
                focused
                  ? icons.homeActive
                  : isDark
                    ? icons.homeDark
                    : icons.home
              }
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Nutritor AI",
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ focused }) => (
            <TabIcon
              Icon={
                focused
                  ? icons.chatbotActive
                  : isDark
                    ? icons.chatbotDark
                    : icons.chatbot
              }
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "AI Camera",
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarIcon: () => <CameraTabIcon />,
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: "Diet",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              Icon={
                focused
                  ? icons.dietActive
                  : isDark
                    ? icons.dietDark
                    : icons.diet
              }
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              Icon={
                focused
                  ? icons.analyticsActive
                  : isDark
                    ? icons.analyticsDark
                    : icons.analytics
              }
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
