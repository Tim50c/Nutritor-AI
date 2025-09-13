import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "./CustomText";

interface WeightEditModalProps {
  visible: boolean;
  onClose: () => void;
  currentValue: number;
  type: "current" | "goal";
  onUpdate: (newValue: number) => Promise<void>;
  weightUnit?: string;
}

const WeightEditModal: React.FC<WeightEditModalProps> = ({
  visible,
  onClose,
  currentValue,
  type,
  onUpdate,
  weightUnit = "kg",
}) => {
  const [inputValue, setInputValue] = useState(currentValue.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue, visible]);

  const handleUpdate = async () => {
    const newValue = parseFloat(inputValue);

    // Validation based on unit
    const maxWeight = weightUnit === "lbs" ? 1100 : 500; // 500kg ≈ 1100lbs
    const unitText = weightUnit === "lbs" ? "lbs" : "kg";

    if (isNaN(newValue) || newValue <= 0 || newValue > maxWeight) {
      Alert.alert(
        "Invalid Weight",
        `Please enter a valid weight between 1 and ${maxWeight} ${unitText}`
      );
      return;
    }

    if (newValue === currentValue) {
      onClose();
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdate(newValue);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to update weight. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const title = type === "current" ? "Edit Current Weight" : "Edit Weight Goal";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full px-6"
        >
          <View className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} disabled={isUpdating}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isUpdating ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 dark:text-gray-400 mb-2">
                Weight ({weightUnit})
              </Text>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={`Enter weight in ${weightUnit}`}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                placeholderTextColor={"#9CA3AF"}
                editable={!isUpdating}
                selectTextOnFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                <Text className="text-center text-gray-700 dark:text-gray-200 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg bg-[#ff5a16]"
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center text-white font-medium">
                    Update
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default WeightEditModal;
