import { TouchableOpacity, Image } from "react-native";

interface IconButtonProps {
  icon: any;
  onPress: () => void;
  className?: string;
  size?: string;
}

export default function IconButton({
                                     icon,
                                     onPress,
                                     className = "",
                                     size = "size-8"
                                   }: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className={className}>
      <Image source={icon} className={size} />
    </TouchableOpacity>
  );
}