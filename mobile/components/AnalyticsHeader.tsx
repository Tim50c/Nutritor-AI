import {View} from 'react-native';
import { Text } from './CustomText';


interface AnalyticsHeaderProps {
  weightGoal: number;
  currentWeight: number;
}


const AnalyticsHeader = ({weightGoal, currentWeight}: AnalyticsHeaderProps) => {
  return (
    <View className="flex-row justify-between items-start mt-4 mx-4">
      <View>
        <Text className="text-gray-700">Weight goal</Text>
        <Text className="text-2xl font-bold">{weightGoal} kg</Text>
      </View>


      <View className="items-end">
        <Text className="text-gray-700">Current weight</Text>
        <Text className="text-2xl font-bold">{currentWeight} kg</Text>
      </View>
    </View>
  );
}


export default AnalyticsHeader;