import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import axios from 'axios';

import AuthHeader from '../components/AuthHeader';
import FormField from '../components/FormField';
import CustomButtonLogin from './CustomButtonAuth';

const API_URL = 'http://nutritor-ai.onrender.com/api/v1/auth/register';

export default function SignUp() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!form.fullName || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      // Step 2: Create user profile in your backend
      const [firstname, ...lastnameParts] = form.fullName.split(' ');
      const lastname = lastnameParts.join(' ');

      await axios.post(
        API_URL,
        {
          firstname,
          lastname,
          email: form.email,
          dob: new Date().toISOString(), // Use a real Date of Birth from a form field in production
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      Alert.alert('Success!', 'Your account has been created. Please log in.');
      router.replace('/sign-in');

    } catch (error: any) {
      let message = "An error occurred during sign up.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (axios.isAxiosError(error)) {
        message = 'Could not create your profile. Please try again later.';
      }
      Alert.alert('Sign Up Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-white flex-1">
      <AuthHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}>
        <View className="flex-1 justify-center pb-8">
          <Text className="text-black text-3xl font-bold mb-2">Create Your NutriAI Account</Text>
          <Text className="text-gray-600 text-base mb-8">Eat better. Get back on track.</Text>

          <FormField
            label="Full Name"
            placeholder="Enter Full Name"
            value={form.fullName}
            onChangeText={(e) => setForm({ ...form, fullName: e })}
          />
          <FormField
            label="Email"
            placeholder="Enter Email"
            value={form.email}
            onChangeText={(e) => setForm({ ...form, email: e })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Password"
            placeholder="Enter Password"
            value={form.password}
            onChangeText={(e) => setForm({ ...form, password: e })}
            secureTextEntry
          />

          <View className="mt-6">
            <CustomButtonLogin title="Sign Up" onPress={handleSignUp} isLoading={isLoading} variant="primary" />
          </View>
          
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-[#FF5A16] font-bold">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}