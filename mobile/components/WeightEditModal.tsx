import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "./CustomText";
import { Ionicons } from "@expo/vector-icons";

interface WeightEditModalProps {
  visible: boolean;
  onClose: () => void;
  currentValue: number;
  type: "current" | "goal";
  onUpdate: (newValue: number) => Promise<void>;
}

const WeightEditModal: React.FC<WeightEditModalProps> = ({
  visible,
  onClose,
  currentValue,
  type,
  onUpdate,
}) => {
  const [inputValue, setInputValue] = useState(currentValue.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue, visible]);

  const handleUpdate = async () => {
    const newValue = parseFloat(inputValue);

    if (isNaN(newValue) || newValue <= 0 || newValue > 500) {
      Alert.alert(
        "Invalid Weight",
        "Please enter a valid weight between 1 and 500 kg"
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
          <View className="bg-white rounded-lg p-6 w-full">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">{title}</Text>
              <TouchableOpacity onPress={onClose} disabled={isUpdating}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-gray-600 mb-2">Weight (kg)</Text>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter weight"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                editable={!isUpdating}
                selectTextOnFocus
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={onClose}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-300"
              >
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isUpdating}
                className="flex-1 py-3 px-4 rounded-lg"
                style={{ backgroundColor: "#ff5a16" }}
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
