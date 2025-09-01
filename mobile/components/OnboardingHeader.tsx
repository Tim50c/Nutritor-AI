import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {Ionicons} from "@expo/vector-icons";

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
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
                        {/*<Image source={backIcon} style={{ width: 24, height: 24, tintColor: '#1F2937' }} />*/}
                      <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                 )}
            </View>

            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, color: '#1F2937', marginTop: 24 }}>
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