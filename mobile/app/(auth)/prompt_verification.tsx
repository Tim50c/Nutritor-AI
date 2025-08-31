import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import CustomButtonAuth from '../../components/CustomButtonAuth';

// icon defined here
const backIcon = require('../../assets/icons/back-arrow.png');

export default function PromptVerification() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <SafeAreaView style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
            <Image source={backIcon} style={{ width: 24, height: 24, tintColor: '#1F2937' }} resizeMode='contain' />
        </TouchableOpacity>
      
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#1F2937', fontSize: 28, fontWeight: 'bold' }}>
              Verify Your Email
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 16, textAlign: 'center', lineHeight: 24 }}>
                We've sent a verification link to {'\n'}
                <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{email}</Text>
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 8, textAlign: 'center', lineHeight: 24 }}>
                Please check your inbox and click the link to continue.
            </Text>
          </View>

          <View style={{ width: '100%', marginTop: 'auto', marginBottom: 40 }}>
            <CustomButtonAuth title="Back to Sign In" onPress={() => router.replace('./sign_in')} />
          </View>
        </View>
    </SafeAreaView>
  );
}