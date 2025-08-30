import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import CustomButtonLogin from './CustomButtonAuth'; // Using your button component

interface Props {
  visible: boolean;
}

export default function PasswordChangedModal({ visible }: Props) {
  const handleLoginPress = () => {
    router.replace('/sign-in');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View className="bg-white w-4/5 rounded-2xl p-6 items-center">
          <Text className="text-black text-xl font-bold mb-2">Password changed</Text>
          <Text className="text-gray-600 text-center mb-6">
            Your password has been updated. You can now log in with your new credentials.
          </Text>
          <View className="w-full">
            <CustomButtonLogin title="Log In" onPress={handleLoginPress} variant="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});