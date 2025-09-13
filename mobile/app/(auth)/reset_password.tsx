import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text } from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/config/firebase';

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';
import { Ionicons } from "@expo/vector-icons";
import { useIsDark } from '@/theme/useIsDark';

export default function ResetPassword() {
  const router = useRouter();
  const { oobCode } = useLocalSearchParams(); 
  
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isDark = useIsDark();

  const handleResetPassword = async () => {
    if (!form.newPassword || !form.confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (typeof oobCode !== 'string' || !oobCode) {
      Alert.alert('Error', 'Invalid or missing reset code. Please try the link again.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, form.newPassword);
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Error Resetting Password', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.replace('./sign_in');
  }

  return (
    <SafeAreaView className="bg-white dark:bg-black flex-1">
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
        <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 120 }}>
          <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Reset Your Password
          </Text>
          <Text className="text-base mt-2 leading-6 text-gray-500 dark:text-gray-300">
            Enter a new password to regain access to your account.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="New Password"
              value={form.newPassword}
              onChangeText={(text) => setForm({ ...form, newPassword: text })}
              placeholder="Enter New Password"
              secureTextEntry
              onFocus={() => setActiveField('newPassword')}
              onBlur={() => setActiveField('')}
              isActive={activeField === 'newPassword'}
            />
            <FormField
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              placeholder="Enter Confirm Password"
              secureTextEntry
              onFocus={() => setActiveField('confirmPassword')}
              onBlur={() => setActiveField('')}
              isActive={activeField === 'confirmPassword'}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <CustomButtonAuth title="Reset Password" onPress={handleResetPassword} isLoading={isSubmitting} />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleModalClose}
      >
        <View className="flex-1 justify-center items-center bg-black/50 dark:bg-white/50">
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[85%] items-center">
            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Password changed
            </Text>
            <Text className="text-base text-center mt-3 leading-6 text-gray-500 dark:text-gray-300">
              Your password has been updated! You can now log in with your new credentials.
            </Text>
            <View className="w-full mt-6">
              <CustomButtonAuth title="Log In" onPress={handleModalClose} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
