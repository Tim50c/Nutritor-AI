import React from 'react';
import { View, Image, Text } from 'react-native';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
  showLoadingText?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ showLoadingText = false }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      {/* App Icon */}
      <Image 
        source={require('../assets/images/icon.png')} 
        style={{
          width: 200,
          height: 200,
          marginBottom: 40,
        }}
        resizeMode="contain"
      />
      
      {/* Loading Indicator */}
      <LoadingSpinner isProcessing={true} size={50} />
      
      {/* Loading Text */}
      {showLoadingText && (
        <Text 
          style={{
            marginTop: 20,
            fontSize: 16,
            color: '#000000', // Black text as requested
            fontWeight: '500',
          }}
        >
          Loading...
        </Text>
      )}
    </View>
  );
};

export default LoadingScreen;
