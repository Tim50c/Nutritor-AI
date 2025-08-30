import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ensure you have a back-arrow icon in your assets
const backIcon = require('../../assets/images/back-arrow.png'); 

export default function AuthHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: 24, height: 60, justifyContent: 'center', backgroundColor: 'white' }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="w-12 h-12 justify-center items-start -ml-2"
      >
        <Image
          source={backIcon}
          style={{ width: 28, height: 28, tintColor: '#000000' }}
        />
      </TouchableOpacity>
    </View>
  );
}