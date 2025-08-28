import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, View} from "react-native";
import {useRouter} from "expo-router";
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
  const { user, setUser } = useUser();

  const handleSave = () => {
    if (!passwordStrengthCheck(newPassword) || newPassword !== confirmPassword) {
      setModalType("error");
      setModalVisible(true);
      return;
    }
    // Hash password and save to context
    const hashedPassword = SHA256(newPassword).toString();
    setUser({ ...user, password: hashedPassword });
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
    <KeyboardAvoidingView
      className="flex-1 bg-white px-6 pt-8"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
      <View className="flex-1 justify-end pb-6">
        <CustomButton label="Save" onPress={handleSave} />
      </View>
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
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;