import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, ActionCodeSettings } from 'firebase/auth';
import { auth } from '../../config/firebase';
import axios from 'axios';
import Constants from 'expo-constants';

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';

// icon defined here
const backIcon = require('../../assets/icons/back-arrow.png');

const IOS_BUNDLE_ID = 'com.app.nutriai';
const ANDROID_PACKAGE_NAME = 'com.app.nutriai';

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDynamicVerificationUrl = () => {
    const slug = Constants.expoConfig?.slug;
    const owner = Constants.expoConfig?.owner || 'anonymous';
    
    if (!slug) {
      return 'https://yourapp.com/verify_email'; 
    }
    
    return `https://auth.expo.io/@${owner}/${slug}`;
  };

  const verificationUrl = getDynamicVerificationUrl();

  const actionCodeSettings: ActionCodeSettings = {
    url: `${verificationUrl}/verify_email`,
    handleCodeInApp: true,
    iOS: {
      bundleId: IOS_BUNDLE_ID,
    },
    android: {
      packageName: ANDROID_PACKAGE_NAME,
    },
  };

  const handleSignUp = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
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
        await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/register`,
        {
            email: form.email,
            firstname: form.firstName,
            lastname: form.lastName,
            dob: '1990-01-01' 
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
        );
        
        // 4. Navigate to a screen telling the user to check their email
        router.replace({ pathname: './prompt_verification', params: { email: form.email } });

    } catch (error: any) {
        // --- MODIFICATION START ---
        let errorMessage = 'An unexpected error occurred. Please try again.';

        if (axios.isAxiosError(error)) {
            // This is an error from your backend server
            console.error("Backend API Error:", error.response?.data || error.message);
            errorMessage = "We couldn't create your profile at this time. Please try again later.";
            // IMPORTANT: The Firebase user was created but backend registration failed.
            // You may want to add logic here to delete the newly created Firebase user to keep things clean.
        } else if (error.code) {
            // This is an error from Firebase Auth
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "This email address is already registered. Please use the Log In page.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "The email address is not valid. Please check and try again.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "The password is too weak. It must be at least 6 characters long.";
                    break;
                default:
                    console.error("Unhandled Firebase Sign-Up Error:", error);
                    break;
            }
        }
        
        Alert.alert('Sign Up Failed', errorMessage);
        // --- MODIFICATION END ---
    } finally {
        setIsSubmitting(false);
    }
    };

  return (
    <SafeAreaView style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
            <Image source={backIcon} style={{ width: 24, height: 24, tintColor: '#1F2937' }} resizeMode='contain' />
        </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Text style={{ color: '#1F2937', fontSize: 28, fontWeight: 'bold' }}>
            Create Your NutritorAI Account
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 8 }}>
            Start your journey to a healthier you.
          </Text>

          <View style={{ marginTop: 32 }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                 <FormField
                  label="First Name" value={form.firstName}
                  onChangeText={(text) => setForm({ ...form, firstName: text })}
                  placeholder="Example: John"
                  onFocus={() => setActiveField('firstName')} onBlur={() => setActiveField('')} isActive={activeField === 'firstName'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Last Name" value={form.lastName}
                  onChangeText={(text) => setForm({ ...form, lastName: text })}
                  placeholder="Example: Doe"
                  onFocus={() => setActiveField('lastName')} onBlur={() => setActiveField('')} isActive={activeField === 'lastName'}
                />
              </View>
            </View>
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
            <CustomButtonAuth title="Sign Up" onPress={handleSignUp} isLoading={isSubmitting} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              Already have an account?{' '}
            </Text>
            <Link href="./sign_in">
              <Text style={{ color: '#FF5A16', fontSize: 14, fontWeight: 'bold' }}>
                Log In
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}