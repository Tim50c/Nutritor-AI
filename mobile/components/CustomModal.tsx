import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";

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
      <View className="flex-1 justify-center items-center bg-black bg-opacity-30">
        <View className="bg-white rounded-2xl p-6 w-4/5 border border-black items-center">
          <Text className="text-xl font-semibold mb-2 text-black">{title}</Text>
          <Text className="text-base text-black mb-6 text-center">{message}</Text>
          <TouchableOpacity
            className="w-full py-3 rounded-2xl bg-primary-200 items-center"
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

