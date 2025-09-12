import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  className?: string;
}

function BaseText(props: CustomTextProps) {
  const { style, className, ...rest } = props;

  const flatStyle = StyleSheet.flatten(style);

  const getFontFamily = () => {
    // Check for bold in className first, then fallback to style
    const isBoldFromClassName = className?.includes('font-bold');
    const weight = isBoldFromClassName ? 'bold' : (flatStyle?.fontWeight || 'normal');
    const fontStyle = flatStyle?.fontStyle || 'normal';
    const isItalic = fontStyle === 'italic';

    switch (weight) {
      case 'normal': case '400': return isItalic ? 'SF-Pro-Display-RegularItalic' : 'SF-Pro-Display-Regular';
      case 'bold': case '700': return isItalic ? 'SF-Pro-Display-BoldItalic' : 'SF-Pro-Display-Bold';
      case '100': return isItalic ? 'SF-Pro-Display-UltralightItalic' : 'SF-Pro-Display-Ultralight';
      case '200': return isItalic ? 'SF-Pro-Display-ThinItalic' : 'SF-Pro-Display-Thin';
      case '300': return isItalic ? 'SF-Pro-Display-LightItalic' : 'SF-Pro-Display-Light';
      case '500': return isItalic ? 'SF-Pro-Display-MediumItalic' : 'SF-Pro-Display-Medium';
      case '600': return isItalic ? 'SF-Pro-Display-SemiboldItalic' : 'SF-Pro-Display-Semibold';
      case '800': return isItalic ? 'SF-Pro-Display-HeavyItalic' : 'SF-Pro-Display-Heavy';
      case '900': return isItalic ? 'SF-Pro-Display-BlackItalic' : 'SF-Pro-Display-Black';
      default: return 'SF-Pro-Display-Regular';
    }
  };

  const textStyle = {
    fontFamily: getFontFamily(),
    // Ensure fontWeight is set for NativeWind compatibility
    ...(className?.includes('font-bold') && { fontWeight: 'bold' as const }),
  };

  return (
    <RNText 
      style={[styles.defaultText, textStyle, style]} 
      className={className}
      {...rest} 
    />
  );
}

const styles = StyleSheet.create({
  defaultText: {
    letterSpacing: 0.5,
  },
});

export const Text = BaseText;