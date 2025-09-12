import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, View, TouchableOpacity, SafeAreaView} from "react-native";
import { Text } from '../../components/CustomText';
import {useRouter} from "expo-router";
import { icons } from "@/constants/icons";
import { useUser } from "@/context/UserContext";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import CustomModal from "@/components/CustomModal";
import { PasswordService } from "@/services";
import { useIsDark } from "@/theme/useIsDark";

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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { userProfile } = useUser();
  const isDark = useIsDark();

  const handleSave = async () => {
    // Reset error message
    setErrorMessage("");

    // Validate passwords
    if (!passwordStrengthCheck(newPassword)) {
      setErrorMessage("Password must be at least 8 characters, contain a number, a letter, and a special character.");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      // Call backend API to change password
      await PasswordService.changePassword({
        newPassword: newPassword
      });
      
      setModalType("success");
      setModalVisible(true);
    } catch (error: any) {
      console.error("Password change error:", error);
      setErrorMessage(error.message || "An error occurred while changing the password.");
      setModalType("error");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalButton = () => {
    setModalVisible(false);
    if (modalType === "success") {
      router.replace("/settings");
    }
    // If error, just close modal and stay
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          className="bg-black dark:bg-white w-10 h-10 rounded-full justify-center items-center" 
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: '0deg' }] }}>
            {isDark ? <icons.arrowDark width={20} height={20} color="#000000" /> : <icons.arrow width={20} height={20} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black dark:text-white">Change Password</Text>
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
            <CustomButton 
              label={loading ? "Saving..." : "Save"} 
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      <CustomModal
        visible={modalVisible}
        title={modalType === "success" ? "Password changed" : "Password Change Failed"}
        message={
          modalType === "success"
            ? "Congratulation! Your password has been updated!"
            : errorMessage || "An error occurred while changing the password."
        }
        buttonLabel={modalType === "success" ? "Go Back" : "Try Again"}
        onButtonPress={handleModalButton}
      />
    </SafeAreaView>
  );
};

export default ChangePassword;