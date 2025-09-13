import {useRouter} from "expo-router";
import {TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import { Text } from './CustomText';
import { useIsDark } from "@/theme/useIsDark";


function CustomHeader({ title }: { title: string }) {
  const isDark = useIsDark();
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pt-8 pb-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <TouchableOpacity onPress={() => router.back()} className="mr-3">
        <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
      </TouchableOpacity>
      <Text className="text-lg font-bold text-black dark:text-white">{title}</Text>
    </View>
  );
}

export default CustomHeader;