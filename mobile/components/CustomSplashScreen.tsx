import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { useIsDark } from '@/theme/useIsDark';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationComplete: () => void;
  showLoadingText?: boolean;
}

const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ 
  onAnimationComplete, 
  showLoadingText = true 
}) => {
  const isDark = useIsDark();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations immediately
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
        console.log("🎯 [CustomSplashScreen] Animation complete, calling onAnimationComplete");
        onAnimationComplete();
      }, 1500);
    });
  }, [onAnimationComplete]);

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* Full Screen Background Image */}
      <Animated.View style={[styles.backgroundContainer, { opacity: fadeAnim }]}>
        {isDark ? (
          <Image 
          source={require('../assets/images/splash-screen-dark.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />) : (
          <Image 
          source={require('../assets/images/splash-screen.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        )}
        
      </Animated.View>
      
      {/* Text Overlay in Center */}
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={[styles.brandText, isDark ? styles.darkBrandText : null]}>NutritorAI</Text>
        <View style={styles.taglineContainer}>
          <Text style={[styles.taglineText, isDark ? styles.darkTaglineText : null]}>Eating </Text>
          <View style={styles.healthyBadge}>
            <Text style={styles.healthyText}>healthy</Text>
          </View>
        </View>
        <Text style={[styles.subText, isDark ? styles.darkSubText : null]}>made easy!</Text>
      </Animated.View>
    
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkContainer: {
    backgroundColor: '#1f2937',
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
  darkBrandText: {
    color: '#fff',
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
  darkTaglineText: {
    color: '#fff',
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
  darkSubText: {
    color: '#fff',
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