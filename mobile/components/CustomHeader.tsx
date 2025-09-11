import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";

function CustomHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pt-8 pb-3 bg-bg-default dark:bg-bg-default-dark border-b border-border-default dark:border-border-default-dark">
      <TouchableOpacity onPress={() => router.back()} className="mr-3">
        <Ionicons name="arrow-back" size={24} color="#111214" />
      </TouchableOpacity>
      <Text className="text-lg font-bold text-default dark:text-default-dark">
        {title}
      </Text>
    </View>
  );
}

export default CustomHeader;
