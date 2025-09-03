import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, View, TouchableOpacity, SafeAreaView} from "react-native";
import { Text } from '../../components/CustomText';
import {useRouter} from "expo-router";
import { icons } from "@/constants/icons";
import { useUser } from "@/context/UserContext";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomModal from "@/components/CustomModal";
import SHA256 from "crypto-js/sha256";

const passwordStrengthCheck = (password: string) => {
  // At least 8 chars, one letter, one number, one special char
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  return regex.test(password);
};

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>("error");
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();

  const handleSave = () => {
    if (!passwordStrengthCheck(newPassword) || newPassword !== confirmPassword) {
      setModalType("error");
      setModalVisible(true);
      return;
    }
    // Hash password and save to context
    const hashedPassword = SHA256(newPassword).toString();
    if (userProfile) {
      setUserProfile({ ...userProfile, password: hashedPassword });
    }
    setModalType("success");
    setModalVisible(true);
  };

  const handleModalButton = () => {
    setModalVisible(false);
    if (modalType === "success") {
      router.replace("/settings");
    }
    // If error, just close modal and stay
  };

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
        <Text className="text-xl font-bold text-black">Change Password</Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1 justify-center px-6"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="justify-center">
          <CustomInput
            label="New Password"
            placeholder="Enter Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <CustomInput
            label="Confirm Password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <View className="mt-8">
            <CustomButton label="Save" onPress={handleSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
      <CustomModal
        visible={modalVisible}
        title={modalType === "success" ? "Password changed" : "Invalid Password"}
        message={
          modalType === "success"
            ? "Congratulation! Your password has been updated!"
            : "Password must be at least 8 characters, contain a number, a letter, a special character, and match the confirmation."
        }
        buttonLabel={modalType === "success" ? "Go Back" : "Try Again"}
        onButtonPress={handleModalButton}
      />
    </SafeAreaView>
  );
};

export default ChangePassword;