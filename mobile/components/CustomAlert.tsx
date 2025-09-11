import React from "react";
import { Animated, Modal, Text, TouchableOpacity } from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "success" | "error" | "info";
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onClose,
  type = "info",
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-success dark:border-success-dark";
      case "error":
        return "border-danger dark:border-danger-dark";
      default:
        return "border-border-default dark:border-border-default-dark";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "bg-success dark:bg-success-dark";
      case "error":
        return "bg-danger dark:bg-danger-dark";
      default:
        return "bg-accent dark:bg-accent-dark";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        className="flex-1 justify-center items-center px-6"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          className={`bg-surface dark:bg-surface-dark rounded-3xl p-6 w-full max-w-sm border-2 shadow-2xl ${getBorderColor()}`}
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Title */}
          <Text className="text-xl font-bold text-default dark:text-default-dark text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-secondary dark:text-secondary-dark text-center leading-6 mb-6">
            {message}
          </Text>

          {/* OK Button */}
          <TouchableOpacity
            className={`${getButtonColor()} rounded-2xl py-4 px-6`}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-semibold text-center">
              OK
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CustomAlert;
