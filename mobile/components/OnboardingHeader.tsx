import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import { icons } from '@/constants/icons';

interface OnboardingHeaderProps {
  title: string;
  progress: number; // e.g., 0.25 for 25%
  backHref?: string;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ title, progress, backHref }) => {
    const router = useRouter();

    return (
        <View style={{ paddingTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
                 {backHref && (
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: '#000000', 
                            borderRadius: 20, 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}
                    >
                        <View style={{ transform: [{ rotate: '0deg' }] }}>
                            <icons.arrow width={20} height={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                 )}
            </View>

            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: '#1F2937', marginTop: 24, fontWeight: 'bold' }}>
                {title}
            </Text>

             <View style={{ marginTop: 24 }}>
                <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 }}>
                    <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: '#FF5A16', borderRadius: 3 }} />
                </View>
            </View>
        </View>
    );
};

export default OnboardingHeader;