import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, ActionCodeSettings } from 'firebase/auth';
import { auth } from '../../config/firebase';
import axios from 'axios';

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';

// icon defined here
const backIcon = require('../../assets/icons/back-arrow.png');

// define username and project slug:
const EXPO_USERNAME = 'ltdsword';
const PROJECT_SLUG = 'nutritorai';
const IOS_BUNDLE_ID = 'com.you.nutriai';
const ANDROID_PACKAGE_NAME = 'com.you.nutriai';

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verificationUrl = `https://auth.expo.io/${EXPO_USERNAME}/${PROJECT_SLUG}`;

  // Firebase Action Code Settings for the verification link
  const actionCodeSettings: ActionCodeSettings = {
    // This is the link that will be in the email.
    // When clicked, Expo's service will open your app using the deep link scheme ('nutriai://').
    // The path `/verify_email` tells your app which screen to open.
    url: `${verificationUrl}/--/verify_email`,
    handleCodeInApp: true,
    iOS: {
      bundleId: IOS_BUNDLE_ID,
    },
    android: {
      packageName: ANDROID_PACKAGE_NAME,
    },
  };

  const handleSignUp = async () => {
    if (!form.fullName || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // 2. Send verification email
      await sendEmailVerification(user, actionCodeSettings);

      // 3. Register user profile on your backend
      const [firstName, ...lastName] = form.fullName.split(' ');
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`,
        {
          email: form.email,
          firstname: firstName,
          lastname: lastName.join(' '),
          dob: '1990-01-01' 
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      // 4. Navigate to prompt screen
      router.push({ pathname: './prompt_verification', params: { email: form.email } });

    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            Create Your NutriAI Account
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 16, marginTop: 8 }}>
            Eat better. Get back on track.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="Full Name" value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              placeholder="Enter Full Name"
              onFocus={() => setActiveField('fullName')} onBlur={() => setActiveField('')} isActive={activeField === 'fullName'}
            />
            <FormField
              label="Email" value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter Email" keyboardType="email-address"
              onFocus={() => setActiveField('email')} onBlur={() => setActiveField('')} isActive={activeField === 'email'}
            />
            <FormField
              label="Password" value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Enter Password" secureTextEntry
              onFocus={() => setActiveField('password')} onBlur={() => setActiveField('')} isActive={activeField === 'password'}
            />
          </View>

          <View style={{ marginTop: 40 }}>
            <CustomButtonAuth title="Sign Up" onPress={handleSignUp} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
              Already have an account?{' '}
            </Text>
            <Link href="./sign_in">
              <Text style={{ color: '#F97316', fontSize: 14, fontWeight: 'bold' }}>
                Log In
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}