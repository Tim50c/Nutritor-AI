import { Tabs } from "expo-router";
import { icons } from "@/constants/icons";
import { Image, View } from "react-native";

function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View className={`p-2 ${focused ? "bg-gray-200 rounded-xl" : ""}`}>
      <Image source={icon} className="size-8" />
    </View>
  );
}

function CameraTabIcon() {
  return (
    <View
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10, // For Android
      }}
      className="absolute -top-10 bg-primary-200 p-3 rounded-2xl border-4 border-white"
    >
      <Image
        source={icons.camera}
        className="size-12"
        style={{ tintColor: "#FFFFFF" }}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
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
              icon={focused ? icons.homeActive : icons.home}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Nutritor AI",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={focused ? icons.chatbotActive : icons.chatbot}
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
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={focused ? icons.dietActive : icons.diet}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={focused ? icons.analyticsActive : icons.analytics}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
