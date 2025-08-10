import {Tabs} from "expo-router";
import {icons} from "@/constants/icons";
import {Image} from "react-native";

function TabIcon({focused, icon}: { focused: boolean; icon: any }) {
  return (
    <Image
      source={icon}
      style={{
        width: 24,
        height: 24,
        tintColor: focused ? "#FF5A16" : "#000000",
      }}
      className="size-8"
    />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "Nutritor AI",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.chatbot} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "AI Camera",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.camera} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: "Diet",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.diet} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.analytics} />
          ),
        }}
      />
    </Tabs>
  )
}