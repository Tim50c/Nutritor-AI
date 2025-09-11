import React from 'react';
import { View, SafeAreaView, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Text } from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { useIsDark } from '@/theme/useIsDark';

import CustomButtonAuth from '../../components/CustomButtonAuth';
import OnboardingHeader from '../../components/OnboardingHeader';

const femaleIcon = require('../../assets/icons/female-avatar.png');
const maleIcon = require('../../assets/icons/male-avatar.png');
const otherIcon = require('../../assets/icons/other-gender.png');

interface GenderOptionProps {
  icon: ImageSourcePropType;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const GenderOption: React.FC<GenderOptionProps & { colors: any }> = ({
  icon,
  label,
  isSelected,
  onPress,
  colors,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : colors.border,
      backgroundColor: isSelected ? colors.highlight : colors.card,
      marginBottom: 16,
    }}
  >
    <Image source={icon} style={{ width: 40, height: 40, marginRight: 16 }} />
    <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: colors.textPrimary }}>
      {label}
    </Text>
    <View
      style={{
        marginLeft: 'auto',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isSelected ? colors.primary : colors.border,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isSelected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />}
    </View>
  </TouchableOpacity>
);

export default function GenderScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const isDark = useIsDark();

  const colors = {
    background: isDark ? '#0B1220' : '#FFFFFF',
    card: isDark ? '#111827' : '#FFFFFF',
    highlight: isDark ? '#1F2937' : '#FFF7F2',
    border: isDark ? '#4B5563' : '#E5E7EB',
    textPrimary: isDark ? '#F3F4F6' : '#1F2937',
    primary: isDark ? '#ff7a3a' : '#ff5a16',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <OnboardingHeader title="What's your gender?" progress={0.5} backHref="/age" />

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <GenderOption
            icon={femaleIcon}
            label="Female"
            isSelected={data.gender === 'Female'}
            onPress={() => updateData({ gender: 'Female' })}
            colors={colors}
          />
          <GenderOption
            icon={maleIcon}
            label="Male"
            isSelected={data.gender === 'Male'}
            onPress={() => updateData({ gender: 'Male' })}
            colors={colors}
          />
          <GenderOption
            icon={otherIcon}
            label="Other"
            isSelected={data.gender === 'Other'}
            onPress={() => updateData({ gender: 'Other' })}
            colors={colors}
          />
        </View>

        <View style={{ paddingBottom: 40 }}>
          <CustomButtonAuth title="Continue" onPress={() => router.push('./height')} disabled={!data.gender} />
        </View>
      </View>
    </SafeAreaView>
  );
}
