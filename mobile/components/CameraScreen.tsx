import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { Text } from './CustomText';
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import LoadingSpinner from "./LoadingSpinner";
import { CameraService } from "@/services";
import NavigationUtils from "@/utils/NavigationUtils";

const CameraScreen = () => {
  const [mode, setMode] = useState("camera"); // "camera" | "barcode" | "gallery"
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const router = useRouter();

  // Handle barcode scanning
  const handleBarcodeScanned = async (result: any) => {
    if (scannedBarcode === result.data || isProcessing) {
      return; // Prevent duplicate scans
    }

    setScannedBarcode(result.data);
    setIsProcessing(true);

    try {
      console.log("🔍 Barcode scanned:", result.data);

      // Use CameraService for barcode lookup
      const barcodeResult = await CameraService.lookupBarcode(result.data);

      if (barcodeResult.success && barcodeResult.data) {
        // Navigate to food detail screen using the real food ID from backend
        const foodId = barcodeResult.foodId || `barcode_${Date.now()}`;
        NavigationUtils.navigateToFoodDetail(barcodeResult.data, foodId);
      } else {
        Alert.alert(
          "Product Not Found",
          `Barcode ${result.data} was not found in our database. You can try taking a photo instead.`,
          [
            { text: "OK", onPress: () => setMode("camera") },
            { text: "Try Again", onPress: () => setScannedBarcode(null) },
          ]
        );
      }
    } catch (error) {
      console.error("💥 Barcode lookup error:", error);
      Alert.alert(
        "Lookup Failed",
        "Could not look up this barcode. Please try again or use the camera instead.",
        [
          { text: "OK", onPress: () => setMode("camera") },
          { text: "Retry", onPress: () => setScannedBarcode(null) },
        ]
      );
    } finally {
      setIsProcessing(false);
      setCapturedImage(null); // Clear captured image when processing ends
    }
  };

  // Reset barcode when switching modes
  React.useEffect(() => {
    if (mode !== "barcode") {
      setScannedBarcode(null);
    }
  }, [mode]);

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

  // Function to handle food recognition using CameraService
  const recognizeFood = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      console.log("📸 Starting food recognition...");

      // Use CameraService for food recognition
      const result = await CameraService.recognizeFood(imageUri);

      if (result.success && result.data) {
        // Navigate to food detail screen with the recognized food data
        const foodId = result.foodId || `temp_${Date.now()}`;
        NavigationUtils.navigateToFoodDetail(result.data, foodId, imageUri);
      } else {
        Alert.alert(
          "Recognition Failed",
          result.message || "Could not recognize the food. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("💥 Food recognition error:", error);
      Alert.alert(
        "Error",
        "An error occurred while recognizing the food. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
      setCapturedImage(null);
    }
  };

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
    if (cameraRef && !isProcessing) {
      try {
        const photo = await cameraRef.takePictureAsync();
        console.log("Captured Photo:", photo.uri);

        // Store the captured image for display during processing
        setCapturedImage(photo.uri);

        // Send to backend based on current mode
        if (mode === "camera") {
          // Send for food recognition
          await recognizeFood(photo.uri);
        }
        // Note: Barcode mode uses live scanning, not photo capture
      } catch (error) {
        console.error("Error capturing photo:", error);
        // Clear captured image on error
        setCapturedImage(null);
      }
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      console.log("Selected Image:", result.assets[0].uri);

      // Send selected image to backend for food recognition
      await recognizeFood(result.assets[0].uri);
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
          onPress={() => NavigationUtils.goBack()}
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
        ) : isProcessing && capturedImage ? (
          <Image
            source={{ uri: capturedImage }}
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
                    barcodeTypes: [
                      "upc_a",
                      "upc_e",
                      "ean13",
                      "ean8",
                      "code128",
                      "qr",
                      "pdf417",
                    ],
                  }
                : undefined
            }
            onBarcodeScanned={
              mode === "barcode" ? handleBarcodeScanned : undefined
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

            {/* Barcode scanning instructions */}
            <View className="absolute bottom-12 left-0 right-0 items-center">
              <View className="bg-black bg-opacity-60 rounded-xl px-6 py-3">
                <Text className="text-white text-center text-sm font-medium">
                  {scannedBarcode
                    ? "Looking up product..."
                    : "Point camera at barcode"}
                </Text>
                {scannedBarcode && (
                  <Text className="text-gray-300 text-center text-xs mt-1">
                    Barcode: {scannedBarcode}
                  </Text>
                )}
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

            {/* Capture Button - Hidden in barcode mode */}
            {mode !== "barcode" && (
              <View className="items-center mb-4">
                <TouchableOpacity
                  onPress={handleCapture}
                  disabled={isProcessing}
                  className={`w-24 h-24 rounded-full items-center justify-center border-4 border-white ${
                    isProcessing ? "bg-gray-400" : "bg-orange-500"
                  }`}
                >
                  <View
                    className={`w-20 h-20 rounded-full items-center justify-center ${
                      isProcessing ? "bg-gray-500" : "bg-orange-600"
                    }`}
                  >
                    <View className="w-5 h-5 bg-white rounded" />
                  </View>
                </TouchableOpacity>
                {isProcessing && (
                  <View className="items-center mt-3">
                    <Text className="text-white text-sm font-medium">
                      Analyzing food...
                    </Text>
                    <Text className="text-gray-300 text-xs mt-1">
                      Please wait while AI identifies your food
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Full-screen loading overlay with blur and spinning loader */}
      {isProcessing && (
        <BlurView
          intensity={20}
          tint="dark"
          className="absolute inset-0 flex-1 items-center justify-center"
        >
          <View className="bg-black bg-opacity-60 rounded-2xl p-8 items-center">
            <View className="mb-6">
              <LoadingSpinner
                isProcessing={isProcessing}
                size={60}
                color="#FF5A16"
              />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">
              Analyzing Food
            </Text>
            <Text className="text-gray-300 text-sm text-center">
              AI is identifying your food and{"\n"}calculating nutrition
              facts...
            </Text>
          </View>
        </BlurView>
      )}
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
