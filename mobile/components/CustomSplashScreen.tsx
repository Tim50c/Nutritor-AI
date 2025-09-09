import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

interface CustomSplashScreenProps {
  onAnimationComplete: () => void;
  showLoadingText?: boolean;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ 
  onAnimationComplete, 
  showLoadingText = true 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();
    
    // Start animations
    Animated.sequence([
      // Icon fade and scale in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Wait a bit more then call completion
      setTimeout(() => {
        onAnimationComplete();
      }, 1000);
    });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Animated App Icon */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginBottom: 60,
        }}
      >
        <Image 
          source={require('../assets/images/icon.png')} 
          style={{
            width: 200,
            height: 200,
          }}
          resizeMode="contain"
        />
      </Animated.View>
      
      {/* Loading Text */}
      {showLoadingText && (
        <Animated.View
          style={{
            opacity: textOpacity,
            position: 'absolute',
            bottom: 100,
          }}
        >
          <Text 
            style={{
              fontSize: 18,
              color: '#000000',
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            Loading...
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

export default CustomSplashScreen;
