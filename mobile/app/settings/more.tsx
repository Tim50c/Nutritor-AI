import { View, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from '../../components/CustomText';
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";

const More = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="bg-black w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: '0deg' }] }}>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">More</Text>
        <View className="w-10 h-10" />
      </View>

      <View className="flex-1 items-center justify-center">
        <Text>More Screen</Text>
      </View>
    </SafeAreaView>
  )
}

export default More;
