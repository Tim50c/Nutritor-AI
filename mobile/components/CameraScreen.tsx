import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";

const CameraScreen = () => {
  const [mode, setMode] = useState("camera"); // "camera" | "barcode" | "gallery"
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  // Animation for scanning line
  const scanLinePosition = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Animate scanning line when in barcode mode
  useEffect(() => {
    if (mode === "barcode") {
      const animateScanning = () => {
        Animated.sequence([
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]).start(() => animateScanning());
      };
      animateScanning();
    }
  }, [mode, scanLinePosition]);

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>Requesting Camera Permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text>No access to camera</Text>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      console.log("Captured Photo:", photo.uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      console.log("Selected Image:", result.assets[0].uri);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (newMode === "gallery") {
      pickImage();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backArrowContainer}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Camera</Text>
      </View>

      {/* Full Screen Camera View - extends over bottom controls */}
      <View className="flex-1 relative">
        {mode === "gallery" && selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <CameraView
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={
              mode === "barcode"
                ? {
                    barcodeTypes: ["qr", "pdf417"],
                  }
                : undefined
            }
            onBarcodeScanned={
              mode === "barcode"
                ? (result) => {
                    console.log("Barcode scanned:", result);
                  }
                : undefined
            }
          />
        )}

        {/* Camera Frame Overlay - Positioned higher in camera view */}
        {mode === "barcode" && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ paddingBottom: 254 }}
          >
            <View className="relative w-80 h-80">
              {/* Animated Scanning Line */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: "100%", // fits inside 80w frame
                  height: 2,
                  backgroundColor: "#ff6b35",
                  borderRadius: 2,
                  top: scanLinePosition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 280], // stays within 280px height
                  }),
                  shadowColor: "#ff6b35",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              />

              {/* Rounded Frame for Barcode */}
              <View className="w-80 h-80 border-4 border-white rounded-3xl opacity-80" />

              {/* Corner brackets */}
              <View className="absolute -top-2 -left-2">
                <View className="w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
              </View>
              <View className="absolute -top-2 -right-2">
                <View className="w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
              </View>
              <View className="absolute -bottom-2 -left-2">
                <View className="w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
              </View>
              <View className="absolute -bottom-2 -right-2">
                <View className="w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
              </View>
            </View>
          </View>
        )}

        {/* Bottom Controls - White background, no blur, larger height */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={styles.bottomControls}
        >
          <View className="px-6 py-8">
            {/* Mode Switch Buttons */}
            <View className="flex-row justify-around mb-8">
              <TouchableOpacity
                className={`flex-1 items-center py-5 mx-2 rounded-xl border border-black ${
                  mode === "camera" ? "bg-orange-500/90" : "bg-orange-500/60"
                }`}
                onPress={() => handleModeChange("camera")}
              >
                <icons.CameraModeIcon width={24} height={24} stroke="white" />
                <Text
                  className="text-black text-sm font-medium"
                  style={{ marginTop: 8 }}
                >
                  AI Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 items-center py-5 mx-2 rounded-xl border border-black ${
                  mode === "barcode" ? "bg-orange-500/90" : "bg-orange-500/60"
                }`}
                onPress={() => handleModeChange("barcode")}
              >
                <icons.BarcodeModeIcon width={24} height={24} stroke="white" />
                <Text
                  className="text-black text-sm font-medium"
                  style={{ marginTop: 8 }}
                >
                  AI Barcode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 items-center py-5 mx-2 rounded-xl border border-black ${
                  mode === "gallery" ? "bg-orange-500/90" : "bg-orange-500/60"
                }`}
                onPress={() => handleModeChange("gallery")}
              >
                <icons.GalleryModeIcon width={24} height={24} stroke="white" />
                <Text
                  className="text-black text-sm font-medium"
                  style={{ marginTop: 8 }}
                >
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>

            {/* Capture Button */}
            <View className="items-center mb-4">
              <TouchableOpacity
                onPress={handleCapture}
                className="w-24 h-24 rounded-full bg-orange-500 items-center justify-center border-4 border-white"
              >
                <View className="w-20 h-20 rounded-full bg-orange-600 items-center justify-center">
                  <View className="w-5 h-5 bg-white rounded" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 36,
    paddingBottom: 10,
    backgroundColor: "#000",
  },
  backArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  bottomControls: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default CameraScreen;
