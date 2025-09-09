import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationComplete: () => void;
  showLoadingText?: boolean;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ 
  onAnimationComplete, 
  showLoadingText = true 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen
    SplashScreen.hideAsync();
    
    // Start animations
    Animated.sequence([
      // Background fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Wait a bit more then call completion
      setTimeout(() => {
        onAnimationComplete();
      }, 1500);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Full Screen Background Image */}
      <Animated.View style={[styles.backgroundContainer, { opacity: fadeAnim }]}>
        <Image 
          source={require('../assets/images/splash-screen.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </Animated.View>
      
      {/* Text Overlay in Center */}
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.brandText}>NutritorAI</Text>
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Eating </Text>
          <View style={styles.healthyBadge}>
            <Text style={styles.healthyText}>healthy</Text>
          </View>
        </View>
        <Text style={styles.subText}>made easy!</Text>
      </Animated.View>
      
      {/* Loading Text at Bottom */}
      {showLoadingText && (
        <Animated.View
          style={[styles.loadingContainer, { opacity: textOpacity }]}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: screenWidth,
    height: screenHeight,
  },
  textContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  brandText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taglineText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
  },
  healthyBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 4,
  },
  healthyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
});

export default CustomSplashScreen;
