import {TouchableOpacity, Image, View} from "react-native";
import {SvgProps} from "react-native-svg";
import React from "react";

interface IconButtonProps {
  Icon:  React.FC<SvgProps>;
  onPress: () => void;
  className?: string;
  size?: number;
}

export default function IconButton({Icon, onPress, className = "m-2", size = 24}: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className={className}>
      <View className={className}>
        <Icon width={size} height={size} />
      </View>
    </TouchableOpacity>
  );
}