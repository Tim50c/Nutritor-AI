import React from "react";
import { View, Modal, TouchableOpacity } from "react-native";
import { Text } from './CustomText';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onButtonPress: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  buttonLabel,
  onButtonPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black/30">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-4/5 border border-black dark:border-gray-600 items-center">
          <Text className="text-xl font-semibold mb-2 text-black dark:text-white">{title}</Text>
          <Text className="text-base text-black dark:text-gray-300 mb-6 text-center">{message}</Text>
          <TouchableOpacity
            className="w-full py-3 rounded-2xl bg-orange-500 items-center"
            onPress={onButtonPress}
          >
            <Text className="text-white text-base font-semibold">{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;