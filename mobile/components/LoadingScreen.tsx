import React from 'react';
import { View, Image, Text, Dimensions, StyleSheet } from 'react-native';
import LoadingSpinner from './LoadingSpinner';
import { useIsDark } from '@/theme/useIsDark';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LoadingScreenProps {
  showLoadingText?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ showLoadingText = false }) => {
  const isDark = useIsDark();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      {/* Full Screen Background Image */}
      <Image
        source={isDark ? require('../assets/images/splash-screen-dark.png') : require('../assets/images/splash-screen.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Loading Content in Center */}
      <View style={styles.loadingContainer}>
        <LoadingSpinner isProcessing={true} size={50} />

        {/* Loading Text */}
        {showLoadingText && (
          <Text
            style={[
              styles.loadingText,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Loading...
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    top: 0,
    left: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoadingScreen;
