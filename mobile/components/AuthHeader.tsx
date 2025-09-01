import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {Ionicons} from "@expo/vector-icons";

export default function AuthHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: 24, height: 60, justifyContent: 'center', backgroundColor: 'white' }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="w-12 h-12 justify-center items-start -ml-2"
      >
        {/*<Image*/}
        {/*  source={backIcon}*/}
        {/*  style={{ width: 28, height: 28, tintColor: '#000000' }}*/}
        {/*/>*/}
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>
    </View>
  );
}