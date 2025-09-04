import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text } from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/config/firebase';

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';
import {Ionicons} from "@expo/vector-icons";

export default function ResetPassword() {
  const router = useRouter();
  const { oobCode } = useLocalSearchParams(); 
  
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    <SafeAreaView style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
            {/*<Image source={backIcon} style={{ width: 24, height: 24, tintColor: '#1F2937' }} resizeMode='contain' />*/}
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 120 }}>
          <Text style={{ color: '#1F2937', fontSize: 28, fontWeight: 'bold' }}>
            Reset Your Password
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 8, lineHeight: 24 }}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '85%', alignItems: 'center' }}>
            <Text style={{ color: '#1F2937', fontSize: 20, fontWeight: 'bold' }}>Password changed</Text>
            <Text style={{ color: '#6B7280', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
              Your password has been updated! You can now log in with your new credentials.
            </Text>
            <View style={{ width: '100%', marginTop: 24 }}>
                <CustomButtonAuth title="Log In" onPress={handleModalClose} />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}