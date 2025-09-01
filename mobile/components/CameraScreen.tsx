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
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { icons } from "@/constants/icons";
import { getAuth } from "firebase/auth";
import app from "@/config/firebase";
import LoadingSpinner from "./LoadingSpinner";

const CameraScreen = () => {
  const [mode, setMode] = useState("camera"); // "camera" | "barcode" | "gallery"
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
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
        // TEMPORARY: Use real Firebase token for testing
        const testToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVmMjQ4ZjQyZjc0YWUwZjk0OTIwYWY5YTlhMDEzMTdlZjJkMzVmZTEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbnV0cml0b3JhaSIsImF1ZCI6Im51dHJpdG9yYWkiLCJhdXRoX3RpbWUiOjE3NTY2OTc1MDMsInVzZXJfaWQiOiJHbUdobnFsbmwzY3dlS1Z4QTFFbERMR3YwYlUyIiwic3ViIjoiR21HaG5xbG5sM2N3ZUtWeEExRWxETEd2MGJVMiIsImlhdCI6MTc1NjY5NzUwMywiZXhwIjoxNzU2NzAxMTAzLCJlbWFpbCI6InR1bmdkdW9uZzA3MDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInR1bmdkdW9uZzA3MDhAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.lgDfP-NiTjH7dmgHyeqCwq_A2XOmEV65jceWwxA7YnXu7R8x4fcB7wr_kKoyaxsxYswRUhxqKkX1xY1H7vUc29fkHS_1blBmeonseNYopFnHV9vJYgEvqHuDLSJZSV4q1nNB0C7JhFT_y9JPfZSZa6I1UnU4p6TE4VDUJ8KnAEW0-C4OdDBsC8MHdCdr_QYH37XLzUauMUNN6IbU7OcDLT4LEx5rmW7Zyj8Zu0N6KfOVzpfiQnqIZ6Ko6sN8IxOoqKeyiroM4A49eU9koHmrIajMLW-o5uOae7grva66W5SefIcEwKaqk2V13_Ck35AeQx1u6MWtCFA7C25WgPxLiw";
        console.warn("No authenticated user found - using real test token");
        return testToken;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  // Get auth headers for API requests
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  // Handle barcode scanning
  const handleBarcodeScanned = async (result: any) => {
    if (scannedBarcode === result.data || isProcessing) {
      return; // Prevent duplicate scans
    }

    setScannedBarcode(result.data);
    setIsProcessing(true);

    try {
      console.log("🔍 Barcode scanned:", result.data);

      // Send barcode to backend for food lookup
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}/api/v1/camera/barcode`, {
        method: "POST",
        headers,
        body: JSON.stringify({ barcode: result.data }),
      });

      const apiResult = await response.json();
      console.log("📦 Barcode lookup result:", apiResult);

      if (apiResult.success && apiResult.data) {
        // Navigate to food detail screen using the real food ID from backend
        const foodId = apiResult.foodId || apiResult.data.id || `barcode_${Date.now()}`;

        router.push({
          pathname: "/food/[id]",
          params: {
            id: foodId,
            foodData: JSON.stringify(apiResult.data),
          },
        });
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

  // Function to send image to backend for food recognition
  const sendImageToBackend = async (imageUri: string, endpoint: string) => {
    try {
      setIsProcessing(true);

      console.log("📸 Original image URI:", imageUri);

      // ✅ Simple approach: Always try compression, use original on failure
      let finalImageUri = imageUri;
      let compressionAttempted = false;

      try {
        console.log("🔄 Attempting image compression...");
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1024 } }], // Resize to max width 1024px
          {
            compress: 0.7, // 70% quality
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        finalImageUri = manipulatedImage.uri;
        compressionAttempted = true;
        console.log("✅ Image compression successful:", {
          originalUri: imageUri,
          compressedUri: manipulatedImage.uri,
          width: manipulatedImage.width,
          height: manipulatedImage.height,
        });
      } catch (compressionError: any) {
        console.warn(
          "⚠️ Image compression failed, using original:",
          compressionError
        );
        finalImageUri = imageUri;
        compressionAttempted = false;
      }

      // ✅ Create FormData with the final image URI (no blob conversion needed)
      const formData = new FormData();
      formData.append("image", {
        uri: finalImageUri,
        type: "image/jpeg",
        name: "food-image.jpg",
      } as any);

      console.log(
        `📦 FormData created with ${compressionAttempted ? "compressed" : "original"} image`
      );

      // ✅ Get auth token
      const authToken = await getAuthToken(); // Create headers with optional authentication
      // ✅ Don't set Content-Type for FormData - let it handle the boundary automatically
      const headers: Record<string, string> = {};

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      } else {
        console.warn(
          "No auth token available - proceeding without authentication"
        );
      }

      console.log("🚀 About to send API request...");
      console.log(`📍 URL: ${BASE_URL}/api/v1/camera/${endpoint}`);
      console.log(`🚀 Sending as FormData (much smaller than base64)`);

      // ✅ Remove timeout to prevent premature aborts on Render.com cold starts
      const apiResponse = await fetch(`${BASE_URL}/api/v1/camera/${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

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

        // Navigate to food detail screen with the recognized food data
        if (result.data && result.data.name) {
          // Use the real food ID from backend response
          const foodId = result.foodId || result.data.id || `temp_${Date.now()}`;

          // Navigate with the food data
          router.push({
            pathname: "/food/[id]",
            params: {
              id: foodId,
              foodData: JSON.stringify(result.data),
              capturedImage: imageUri, // Pass the captured image
            },
          });
        } else {
          // Fallback alert if no food data
          Alert.alert("Analysis Complete", "Food recognized successfully!", [
            { text: "OK" },
          ]);
        }

        return result;
      } else {
        console.error("Backend error:", result);
        Alert.alert(
          "Error",
          `Analysis failed: ${result.message || "Unknown error"}`
        );
        return null;
      }
    } catch (error: any) {
      console.error("💥 Error in optimized image processing:", error);

      // ✅ Fallback: Try with original method if compression/blob conversion fails
      if (
        error?.message?.includes("compression failed") ||
        error?.message?.includes("Blob conversion failed")
      ) {
        console.log("🔄 Falling back to original image upload method...");
        try {
          const fallbackFormData = new FormData();
          fallbackFormData.append("image", {
            uri: imageUri,
            type: "image/jpeg",
            name: "food-image.jpg",
          } as any);

          const authToken = await getAuthToken();
          const headers: Record<string, string> = {};
          if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
          }

          console.log("🚀 Sending fallback request...");
          const apiResponse = await fetch(
            `${BASE_URL}/api/v1/camera/${endpoint}`,
            {
              method: "POST",
              headers,
              body: fallbackFormData,
            }
          );

          const responseText = await apiResponse.text();
          console.log("📄 Fallback response received");

          if (apiResponse.ok) {
            const result = JSON.parse(responseText);
            console.log("✅ Fallback request successful");

            if (result.data && result.data.name) {
              const foodId = result.foodId || result.data.id || `temp_${Date.now()}`;
              router.push({
                pathname: "/food/[id]",
                params: {
                  id: foodId,
                  foodData: JSON.stringify(result.data),
                  capturedImage: imageUri,
                },
              });
            }
            return result;
          } else {
            throw new Error(`Fallback request failed: ${apiResponse.status}`);
          }
        } catch (fallbackError) {
          console.error("❌ Fallback method also failed:", fallbackError);
        }
      }

      // ✅ Standard error handling for other types of errors
      if (error?.name === "AbortError") {
        Alert.alert(
          "Request Timeout",
          "The server is taking too long to respond. Please try again."
        );
      } else if (error?.message?.includes("Network request failed")) {
        Alert.alert(
          "Network Error",
          "Cannot reach the server. Please check your internet connection and try again."
        );
      } else if (
        error?.message?.includes("JSON Parse error") ||
        error instanceof SyntaxError
      ) {
        Alert.alert(
          "Server Error",
          "The server returned an invalid response. Please try again later."
        );
      } else if (error?.message?.includes("Server error")) {
        Alert.alert(
          "Analysis Failed",
          "The image analysis failed. Please try with a clearer image."
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
      setCapturedImage(null); // Clear captured image when processing ends
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
          const result = await sendImageToBackend(
            photo.uri,
            "recognize-details"
          );
          if (result) {
            console.log("Food recognition result:", result);
            // Handle the food recognition result
          }
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
