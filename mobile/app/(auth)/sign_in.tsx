import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase'; 

import FormField from '../../components/FormField';
import CustomButtonAuth from '../../components/CustomButtonAuth';

// icon defined here
const googleIcon = require('../../assets/icons/google-icon.png');
const appleIcon = require('../../assets/icons/apple-icon.png');

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [activeField, setActiveField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };
    if (!form.email) { newErrors.email = 'Please enter your email'; valid = false; }
    if (!form.password) { newErrors.password = 'Please enter your password'; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      
      if (!userCredential.user.emailVerified) {
        Alert.alert(
          "Verify Your Email",
          "You need to verify your email before you can log in. Would you like us to resend the verification link?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Resend", onPress: () => sendEmailVerification(userCredential.user) }
          ]
        );
        setIsSubmitting(false);
        return;
      }
      
      // On success, Expo Router's root layout will handle redirection to the main app.
      router.replace('/'); 

    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: '#121212', flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
            Welcome Back to NutriAI
          </Text>
          <Text style={{ color: '#A0A0A0', fontSize: 16, marginTop: 8 }}>
            Eat better. Get back on track.
          </Text>

          <View style={{ marginTop: 32 }}>
            <FormField
              label="Email" value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter Email" keyboardType="email-address"
              onFocus={() => setActiveField('email')} onBlur={() => setActiveField('')}
              isActive={activeField === 'email'} error={errors.email}
            />
            <FormField
              label="Password" value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Enter Password" secureTextEntry
              onFocus={() => setActiveField('password')} onBlur={() => setActiveField('')}
              isActive={activeField === 'password'} error={errors.password}
            />
            <Link href="./forgot_password" style={{ alignSelf: 'flex-end', marginTop: -8 }}>
              <Text style={{ color: '#A0A0A0', fontSize: 14 }}>Forgot Password?</Text>
            </Link>
          </View>

          <View style={{ marginTop: 40 }}>
            <CustomButtonAuth title="Log In" onPress={handleSignIn} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#4B5563' }} />
            <Text style={{ color: '#9CA3AF', marginHorizontal: 10 }}>Or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#4B5563' }} />
          </View>

          <View style={{ gap: 16 }}>
             <CustomButtonAuth title="Continue with Google" onPress={() => {}} variant="social" icon={googleIcon} />
             <CustomButtonAuth title="Continue with Apple" onPress={() => {}} variant="social" icon={appleIcon} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
            <Text style={{ color: '#A0A0A0', fontSize: 14 }}>
              Don't have an account?{' '}
            </Text>
            <Link href="./sign_up">
              <Text style={{ color: '#F97316', fontSize: 14, fontWeight: 'bold' }}>
                Sign Up
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}