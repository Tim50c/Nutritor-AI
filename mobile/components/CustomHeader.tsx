import {useRouter} from "expo-router";
import {Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";


function CustomHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pt-8 pb-3 bg-white border-b border-gray-200">
      <TouchableOpacity onPress={() => router.back()} className="mr-3">
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text className="text-lg font-semibold">{title}</Text>
    </View>
  );
}

export default CustomHeader;