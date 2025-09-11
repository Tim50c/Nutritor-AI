import React from "react";
import { Modal, TouchableOpacity, View } from "react-native";
import { Text } from "./CustomText";

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
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black bg-opacity-30 dark:bg-black/60">
        <View className="bg-surface dark:bg-surface-dark rounded-2xl p-6 w-4/5 border border-border-default dark:border-border-default-dark items-center">
          <Text className="text-xl font-semibold mb-2 text-default dark:text-default-dark">
            {title}
          </Text>
          <Text className="text-base mb-6 text-center text-default dark:text-default-dark">
            {message}
          </Text>
          <TouchableOpacity
            className="w-full py-3 rounded-2xl bg-accent dark:bg-accent-dark items-center"
            onPress={onButtonPress}
          >
            <Text className="text-white text-base font-semibold">
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomModal;
