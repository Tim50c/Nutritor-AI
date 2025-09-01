import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase'; // Import auth from your config file

import FormField from '../components/FormField';
import CustomButtonLogin from './CustomButtonAuth';

const googleIcon = require('../assets/images/google-icon.png');
const appleIcon = require('../assets/images/apple-icon.png');

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };
    if (!form.email) {
      newErrors.email = 'Please enter your email';
      valid = false;
    }
    if (!form.password) {
      newErrors.password = 'Please enter your password';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.replace('/(tabs)/'); // Navigate to home screen
    } catch (error: any) {
      Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-white flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}>
        <View className="flex-1 justify-center">
          <View className="mb-10">
            <Text className="text-black text-3xl font-bold">Welcome Back to NutriAI</Text>
            <Text className="text-gray-600 text-base mt-2">Eat better. Get back on track.</Text>
          </View>

          <FormField
            label="Email"
            placeholder="Enter Email"
            value={form.email}
            onChangeText={(e) => setForm({ ...form, email: e })}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <FormField
            label="Password"
            placeholder="Enter Password"
            value={form.password}
            onChangeText={(e) => setForm({ ...form, password: e })}
            secureTextEntry
            error={errors.password}
          />

          <Link href="/forgot-password" asChild>
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-gray-600">Forgot Password?</Text>
            </TouchableOpacity>
          </Link>

          <CustomButtonLogin title="Log In" onPress={handleSignIn} isLoading={isLoading} variant="primary" />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500">Or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <View className="space-y-4">
            <CustomButtonLogin title="Continue with Google" onPress={() => {}} variant="social" icon={googleIcon} />
            <CustomButtonLogin title="Continue with Apple" onPress={() => {}} variant="social" icon={appleIcon} />
          </View>
          
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-[#FF5A16] font-bold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}