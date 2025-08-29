import {Text, View} from "react-native";
import {useLocalSearchParams} from "expo-router";

const FoodDetails = () => {
  const {id} = useLocalSearchParams();

  return (
    <View className="flex-1 justify-center items-center w-full">
     <Text>Food ID: {id}</Text>
    </View>
  )
}

export default FoodDetails;