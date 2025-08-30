import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';

// icon defined here
const backIcon = require('../../assets/icons/back-arrow.png');

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Check Your Email', 'A password reset link has been sent to your email address.');
      router.push('./sign-in');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#121212', flex: 1 }}>
      <TouchableOpacity 
          onPress={() => router.back()} 
          style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
          <Image source={backIcon} style={{ width: 24, height: 24, tintColor: 'white' }} resizeMode='contain' />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 120 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            Forgot Your Password?
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 16, marginTop: 8, lineHeight: 24 }}>
            No worries! Enter your email, and we’ll send you a reset link.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter Email"
              keyboardType="email-address"
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField('')}
              isActive={activeField === 'email'}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <CustomButtonAuth title="Send Reset Link" onPress={handleSendResetLink} />
          <TouchableOpacity onPress={() => router.push('./sign-in')} style={{ marginTop: 24, alignSelf: 'center' }}>
            <Text style={{ color: '#F97316', fontSize: 14, fontWeight: 'bold' }}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}