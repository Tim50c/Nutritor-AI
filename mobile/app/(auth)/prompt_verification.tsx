import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import {Ionicons} from "@expo/vector-icons";

// icon defined here

export default function PromptVerification() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <SafeAreaView style={{ backgroundColor: '#FFFFFF', flex: 1 }}>
        {/* <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', top: 60, left: 24, zIndex: 10 }}>
            {/*<Image source={backIcon} style={{ width: 24, height: 24, tintColor: '#1F2937' }} resizeMode='contain' />
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity> */}
      
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Main content centered vertically */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}> 
            <Text style={{ color: '#1F2937', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, marginTop: 30 }}>
              Verify Your Email
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 16, textAlign: 'center', lineHeight: 26, paddingHorizontal: 10 }}>
                We&#39;ve sent a verification link to {'\n'}
                <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{email}</Text>
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 26, paddingHorizontal: 10 }}>
                Please check your inbox and click the link to continue.
            </Text>
          </View>

          <View style={{ width: '100%', paddingBottom: 40 }}>
            <CustomButtonAuth title="Back to Sign In" onPress={() => router.replace('./sign_in')} />
          </View>
      </View>
    </SafeAreaView>
  );
}