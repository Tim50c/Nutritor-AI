import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native'; // Import ImageSourcePropType
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';

// icon defined here
const femaleIcon = require('../../assets/icons/female-avatar.png');
const maleIcon = require('../../assets/icons/male-avatar.png');
const otherIcon = require('../../assets/icons/other-gender.png');

// --- DEFINE THE PROPS INTERFACE ---
interface GenderOptionProps {
  icon: ImageSourcePropType;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

// --- APPLY THE TYPE TO THE COMPONENT ---
const GenderOption: React.FC<GenderOptionProps> = ({ icon, label, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isSelected ? '#FF5A16' : '#E5E7EB',
      backgroundColor: isSelected ? '#FFF7F2' : '#FFFFFF',
      marginBottom: 16,
    }}
  >
    <Image source={icon} style={{ width: 40, height: 40, marginRight: 16 }} />
    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: '#1F2937' }}>{label}</Text>
    <View style={{
      marginLeft: 'auto',
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isSelected ? '#FF5A16' : '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {isSelected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF5A16' }} />}
    </View>
  </TouchableOpacity>
);

export default function GenderScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader title="What's your gender?" progress={0.5} backHref="/age" />
        
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <GenderOption 
            icon={femaleIcon} 
            label="Female" 
            isSelected={data.gender === 'Female'} 
            onPress={() => updateData({ gender: 'Female' })} 
          />
          <GenderOption 
            icon={maleIcon} 
            label="Male" 
            isSelected={data.gender === 'Male'} 
            onPress={() => updateData({ gender: 'Male' })} 
          />
          <GenderOption 
            icon={otherIcon} 
            label="Other" 
            isSelected={data.gender === 'Other'} 
            onPress={() => updateData({ gender: 'Other' })} 
          />
        </View>

        <View style={{ paddingBottom: 40 }}>
          {/* This button will now work correctly without errors */}
          <CustomButtonAuth 
            title="Continue" 
            onPress={() => router.push('./current_weight')}
            disabled={!data.gender} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}