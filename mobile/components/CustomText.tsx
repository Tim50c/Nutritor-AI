import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';

// This is our new Text component. It will accept all the same props as the original.
export function Text(props: TextProps) {
  // Destructure the style from props, and pass the rest of the props through.
  const { style, ...rest } = props;

  // StyleSheet.flatten is used to merge style objects.
  const flatStyle = StyleSheet.flatten(style);

  // This function determines which font file to use based on style props.
  const getFontFamily = () => {
    const weight = flatStyle?.fontWeight || 'normal'; // Default to 'normal'
    const fontStyle = flatStyle?.fontStyle || 'normal'; // Default to 'normal'

    const isItalic = fontStyle === 'italic';

    // Map React Native's fontWeight values to our font file names
    switch (weight) {
      case 'normal':
      case '400':
        return isItalic ? 'SF-Pro-Display-RegularItalic' : 'SF-Pro-Display-Regular';
      case 'bold':
      case '700':
        return isItalic ? 'SF-Pro-Display-BoldItalic' : 'SF-Pro-Display-Bold';
      case '100':
        return isItalic ? 'SF-Pro-Display-UltralightItalic' : 'SF-Pro-Display-Ultralight';
      case '200':
        return isItalic ? 'SF-Pro-Display-ThinItalic' : 'SF-Pro-Display-Thin';
      case '300':
        return isItalic ? 'SF-Pro-Display-LightItalic' : 'SF-Pro-Display-Light';
      case '500':
        return isItalic ? 'SF-Pro-Display-MediumItalic' : 'SF-Pro-Display-Medium';
      case '600':
        return isItalic ? 'SF-Pro-Display-SemiboldItalic' : 'SF-Pro-Display-Semibold';
      case '800':
        return isItalic ? 'SF-Pro-Display-HeavyItalic' : 'SF-Pro-Display-Heavy';
      case '900':
        return isItalic ? 'SF-Pro-Display-BlackItalic' : 'SF-Pro-Display-Black';
      default:
        return 'SF-Pro-Display-Regular'; // Fallback
    }
  };

  // Create the new style object with our dynamic font family
  const textStyle = {
    fontFamily: getFontFamily(),
  };

  // Render the original React Native Text component with the new styles
  return <RNText style={[styles.defaultText, textStyle, style]} {...rest} />;
}

// You can add any other global default styles here
const styles = StyleSheet.create({
  defaultText: {
    // For example, you could set a default color
    // color: '#333',
    letterSpacing: 0.5, 
  },
});