import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import { getAuth } from "firebase/auth";
import app from "@/config/firebase";

const CameraScreen = () => {
  const [mode, setMode] = useState("camera"); // "camera" | "barcode" | "gallery"
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Base URL for your backend
  const BASE_URL = "https://nutritor-ai.onrender.com";
  const auth = getAuth(app);

  // Function to get Firebase ID token for authentication
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return token;
      } else {
        // For development, you might want to sign in a test user
        // For now, we'll return null and handle the unauthenticated case
        console.warn("No authenticated user found");
        return null;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  // Test server connectivity
  const testServerConnection = async () => {
    try {
      console.log("🧪 Testing server connection...");
      const response = await fetch(`${BASE_URL}/health`);
      const text = await response.text();
      console.log("✅ Server response:", text);
      Alert.alert(
        "Server Test",
        `Status: ${response.status}\nResponse: ${text.substring(0, 100)}`
      );
    } catch (error) {
      console.error("❌ Server test failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Server Test Failed", errorMessage);
    }
  };

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

  // Function to send image to backend for food recognition
  const sendImageToBackend = async (imageUri: string, endpoint: string) => {
    try {
      setIsProcessing(true);

      if (endpoint === "barcode") {
        // For barcode scanning, we need to extract barcode from image first
        // This is a simplified approach - in reality you'd use a barcode scanning library
        Alert.alert(
          "Barcode Feature",
          "Barcode scanning from image is not yet implemented. Please use a barcode scanning library like expo-barcode-scanner.",
          [{ text: "OK" }]
        );
        return null;
      }

      // Convert image to FormData for efficient upload
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "food-image.jpg",
      } as any);

      // Send as FormData with optional authentication
      const authToken = await getAuthToken();

      // Create headers with optional authentication
      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      } else {
        console.warn(
          "No auth token available - proceeding without authentication"
        );
      }

      console.log("🚀 About to send API request...");
      console.log(`📍 URL: ${BASE_URL}/api/v1/camera/${endpoint}`);
      console.log(`� Sending as FormData (much smaller than base64)`);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("⏰ Request timeout - aborting...");
        controller.abort();
      }, 30000); // 30 second timeout

      const apiResponse = await fetch(`${BASE_URL}/api/v1/camera/${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🎯 API request completed!");
      console.log(`📡 Response status: ${apiResponse.status}`);
      console.log(
        `📋 Response content type:`,
        apiResponse.headers.get("content-type")
      );

      // Get the raw response text first
      const responseText = await apiResponse.text();
      console.log(
        `📄 Raw response (first 200 chars):`,
        responseText.substring(0, 200)
      );

      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON Parse Error - Response is not valid JSON:");
        console.error("Full response:", responseText);

        Alert.alert(
          "Server Error",
          `The server returned an invalid response. Status: ${apiResponse.status}\n\nResponse preview: ${responseText.substring(0, 100)}...`
        );
        return null;
      }

      if (apiResponse.ok) {
        console.log("Backend response:", result);

        // Show success alert with result
        Alert.alert(
          "Analysis Complete",
          `${result.data?.name || "Food recognized successfully!"}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to results screen or add to diet
                // router.push({ pathname: '/food-results', params: { data: JSON.stringify(result) } });
              },
            },
          ]
        );

        return result;
      } else {
        console.error("Backend error:", result);
        Alert.alert(
          "Error",
          `Analysis failed: ${result.message || "Unknown error"}`
        );
        return null;
      }
    } catch (error) {
      console.error("💥 Error sending image to backend:", error);

      // More specific error handling
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        Alert.alert(
          "Network Error",
          "Cannot reach the server. Please check your internet connection."
        );
      } else if (
        error instanceof SyntaxError &&
        error.message.includes("JSON Parse error")
      ) {
        Alert.alert(
          "Server Error",
          "The server returned an invalid response. The service might be temporarily unavailable."
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        Alert.alert(
          "Connection Error",
          `Failed to connect to server: ${errorMessage}`
        );
      }
      return null;
    } finally {
      setIsProcessing(false);
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

        // Send to backend based on current mode
        if (mode === "camera") {
          // Send for food recognition
          const result = await sendImageToBackend(
            photo.uri,
            "recognize-details"
          );
          if (result) {
            console.log("Food recognition result:", result);
            // Handle the food recognition result
          }
        } else if (mode === "barcode") {
          // Send for barcode recognition
          const result = await sendImageToBackend(photo.uri, "barcode");
          if (result) {
            console.log("Barcode recognition result:", result);
            // Handle the barcode recognition result
          }
        }
      } catch (error) {
        console.error("Error capturing photo:", error);
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
      const apiResult = await sendImageToBackend(
        result.assets[0].uri,
        "recognize-details"
      );
      if (apiResult) {
        console.log("Gallery image recognition result:", apiResult);
        // Handle the food recognition result
      }
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
                  {isProcessing ? (
                    <Text className="text-white text-xs font-bold">...</Text>
                  ) : (
                    <View className="w-5 h-5 bg-white rounded" />
                  )}
                </View>
              </TouchableOpacity>
              {isProcessing && (
                <Text className="text-gray-600 text-sm mt-2">
                  Processing...
                </Text>
              )}
            </View>

            {/* Debug: Test Server Button */}
            <View className="items-center">
              <TouchableOpacity
                onPress={testServerConnection}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white text-sm">Test Server</Text>
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
