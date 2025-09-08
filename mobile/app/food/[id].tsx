import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import DietService from "@/services/diet-service";
import FoodService from "@/services/food-service";
import CameraService from "@/services/camera-service";
import { FOODS } from "@/data/mockData";
import { useDietContext } from "@/context/DietContext";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { Camera, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

// Define the Food interface based on the backend response
interface FoodData {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  imageUrl?: string;
  nutrition: {
    cal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  source: string;
  userId?: string;
}

// Reusable MacroCard Component
interface MacroCardProps {
  title: string;
  value: string;
  percentage?: number;
  backgroundColor: string;
  textColor?: string;
}

const MacroCard: React.FC<MacroCardProps> = ({
  title,
  value,
  percentage,
  backgroundColor,
  textColor = "text-gray-800",
}) => {
  // Determine if percentage exceeds 100% and set appropriate colors
  const isOverGoal = percentage !== undefined && percentage > 100;
  const progressBarWidth =
    percentage !== undefined ? Math.min(percentage, 100) : 0;
  const progressBarColor = isOverGoal ? "bg-red-500" : "bg-black/40";

  return (
    <View className={`flex-1 p-4 rounded-2xl mx-1 ${backgroundColor}`}>
      <Text className={`text-sm font-medium ${textColor} mb-1`}>{title}</Text>
      <Text className={`text-xl font-bold ${textColor} mb-2`}>{value}</Text>
      {percentage !== undefined && (
        <View className="flex-row items-center justify-between">
          <View className="flex-1 bg-black/20 rounded-full h-1.5 mr-2">
            <View
              className={`${progressBarColor} rounded-full h-1.5`}
              style={{ width: `${progressBarWidth}%` }}
            />
          </View>
          <Text
            className={`text-xs font-medium ${textColor} ${isOverGoal ? "text-red-600" : ""}`}
          >
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
};

// Goal Component
const GoalCard: React.FC = () => (
  <View className="bg-gray-100 rounded-2xl p-4 mb-6">
    <View className="flex-row items-center">
      <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center mr-3">
        <Ionicons name="checkmark-circle-outline" size={24} color="#666" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 mb-1">Goal</Text>
        <Text className="text-gray-600">Heart Health, Weight Maintenance</Text>
      </View>
    </View>
  </View>
);

const FoodDetails = () => {
  const { id, foodData, capturedImage } = useLocalSearchParams();
  const [isAddingToDiet, setIsAddingToDiet] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const { refreshData, fetchFavoriteFoods, isFavorite, toggleFavorite, goToToday } =
    useDietContext();

  // Image-related states
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(
    null
  );
  const [pickerAction, setPickerAction] = useState<"gallery" | "camera" | null>(
    null
  );

  // Add state to track updated food data
  const [updatedFoodData, setUpdatedFoodData] = useState<string | null>(null);

  // Parse real API food data or use mock data as fallback
  const food = React.useMemo(() => {
    // Use updated food data if available, otherwise use original
    const dataToUse = updatedFoodData || foodData;

    if (dataToUse && typeof dataToUse === "string") {
      try {
        const parsedFood: FoodData = JSON.parse(dataToUse);
        console.log("🍎 Processed food:", {
          name: parsedFood.name,
          hasImage: !!parsedFood.imageUrl,
          imageUrl: parsedFood.imageUrl,
        });

        const finalFood = {
          id: parsedFood.id || id,
          name: parsedFood.name,
          description: parsedFood.description,
          calories: parsedFood.nutrition.cal || 0,
          protein: parsedFood.nutrition.protein || 0,
          carbs: parsedFood.nutrition.carbs || 0,
          fat: parsedFood.nutrition.fat || 0,
          image: parsedFood.imageUrl ? { uri: parsedFood.imageUrl } : null,
          source: parsedFood.source,
          barcode: parsedFood.barcode,
        };

        return finalFood;
      } catch (error) {
        console.error("Error parsing food data:", error);
      }
    }

    // Fallback to mock data if no API data available
    return FOODS.find((item) => item.id === id);
  }, [id, foodData, updatedFoodData]);

  // Initialize current image
  React.useEffect(() => {
    const initializeImages = () => {
      let imageUri: string | null = null;

      if (capturedImage) {
        imageUri = capturedImage as string;
      } else if (food?.image) {
        imageUri = typeof food.image === "string" ? food.image : food.image.uri;
      }

      setCurrentImage(imageUri);
    };

    initializeImages();
  }, [capturedImage, food]);

  // Handle image picker actions
  React.useEffect(() => {
    if (!pickerAction) return;

    const executeAction = async () => {
      if (pickerAction === "gallery") {
        await launchGallery();
      } else if (pickerAction === "camera") {
        await launchCamera();
      }
      setPickerAction(null);
    };

    setTimeout(executeAction, 750);
  }, [pickerAction]);

  const handleImagePress = () => {
    setShowImageOptions(true);
  };

  const handleGalleryPress = () => {
    setShowImageOptions(false);
    setPickerAction("gallery");
  };

  const takePhoto = () => {
    setShowImageOptions(false);
    setPickerAction("camera");
  };

  const launchGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access the photo library is required!"
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!pickerResult.canceled) {
        const asset = pickerResult.assets[0];

        // Update image with proper state management
        await updateFoodImage(asset.uri);
      }
    } catch (error) {
      console.error("Error picking image from library:", error);
      Alert.alert("Error", "Could not open the gallery. Please try again.");
    }
  };

  const launchCamera = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access the camera is required!"
      );
      return;
    }
    setCameraPermission(true);
    setShowCameraModal(true);
  };

  const handleCameraCapture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        setShowCameraModal(false);

        // Update image with proper state management
        await updateFoodImage(photo.uri);
      } catch (error) {
        console.error("Error capturing photo:", error);
        Alert.alert("Error", "Failed to capture photo");
      }
    }
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
  };

  // Function to update image with complete replacement
  const updateFoodImage = async (imageUri: string) => {
    if (!food?.id) {
      Alert.alert("Error", "Unable to update image. Food ID not found.");
      return;
    }

    console.log("📤 Updating image for:", food.name);

    // Show the new image immediately
    setCurrentImage(imageUri);

    try {
      setIsSavingImage(true);

      // First upload the image to get URL
      const uploadResult = await CameraService.uploadImage(imageUri);

      if (!uploadResult.success || !uploadResult.imageUrl) {
        throw new Error(uploadResult.message || "Failed to upload image");
      }

      console.log("✅ Image uploaded:", uploadResult.imageUrl);

      // Then update the food record with the new image URL
      const foodId = Array.isArray(food.id) ? food.id[0] : food.id;

      const updateResponse = await FoodService.updateFoodImage(
        foodId,
        uploadResult.imageUrl
      );

      console.log("✅ Food database updated successfully");

      // Update the food data state with the new image URL
      if (foodData && typeof foodData === "string") {
        try {
          const currentFood = JSON.parse(foodData);
          const updatedFood = {
            ...currentFood,
            imageUrl: uploadResult.imageUrl,
          };
          setUpdatedFoodData(JSON.stringify(updatedFood));
          console.log("✅ Local food data updated");
        } catch (error) {
          console.error("Error updating food data manually:", error);
        }
      }

      // IMPORTANT: Refresh global food cache to update all food cards across the app
      try {
        // Refresh all cached food data that might contain this food
        await Promise.all([
          refreshData(), // Refreshes home data (history foods) and suggestions
          fetchFavoriteFoods(), // Refreshes favorite foods cache
        ]);
        console.log("✅ Global food cache refreshed");
      } catch (error) {
        console.error("❌ Error refreshing global cache:", error);
        // Don't fail the whole operation if cache refresh fails
      }
    } catch (error) {
      console.error("❌ Error saving image:", error);

      Alert.alert("Upload Failed", "Failed to save image. Please try again.", [
        {
          text: "Retry",
          onPress: () => updateFoodImage(imageUri),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } finally {
      setIsSavingImage(false);
    }
  };

  // Legacy function for backward compatibility
  const saveImageToBackend = updateFoodImage;

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!food?.id) return;

    const foodId = Array.isArray(food.id) ? food.id[0] : food.id;
    const dietFood = {
      id: foodId,
      name: food.name,
      image: food.image,
      calories: food.calories || 0,
      carbs: food.carbs || 0,
      protein: food.protein || 0,
      fat: food.fat || 0,
      description: food.description || `${food.name} - Nutritional Information`,
    };

    await toggleFavorite(foodId, dietFood);
  };

  // Handle case where food is not found
  if (!food) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-600">Food not found</Text>
        <CustomButton
          label="Go Back"
          onPress={() => router.back()}
          style="mt-4 mx-6"
        />
      </View>
    );
  }

  // Calculate percentages for macros (assuming daily targets)
  const proteinPercentage = Math.round(((food.protein || 0) / 150) * 100); // 150g daily target
  const carbsPercentage = Math.round(((food.carbs || 0) / 250) * 100); // 250g daily target
  const fatPercentage = Math.round(((food.fat || 0) / 70) * 100); // 70g daily target

  const handleAddToDiet = async () => {
    if (!food?.id) {
      Alert.alert("Error", "Unable to add food to diet. Food ID not found.");
      return;
    }

    try {
      setIsAddingToDiet(true);

      // Ensure food.id is a string
      const foodId = Array.isArray(food.id) ? food.id[0] : food.id;

      // ⏰ LOG: Time tracking for timezone debugging
      const now = new Date();
      const isoString = now.toISOString();
      const localString = now.toString();
      
      // Use local date components to avoid timezone issues  
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const dateOnly = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log("🍽️ [Food Details] Adding food to diet:");
      console.log("  ⏰ Current time (ISO):", isoString);
      console.log("  ⏰ Current time (Local):", localString);
      console.log("  📅 Local components - Year:", year, "Month:", month, "Day:", day);
      console.log("  📅 Date being used:", dateOnly);
      console.log("  🥘 Food ID:", foodId);
      console.log("  🥘 Food name:", food.name);

      // Add food to today's diet using the DietService
      await DietService.addFoodToTodayDiet({ foodId });

      console.log("✅ [Food Details] Food added successfully, going to today and refreshing...");

      // First navigate to today's date to ensure we're viewing the correct day
      goToToday();
      
      // Small delay to ensure date change is processed, then refresh data
      setTimeout(async () => {
        await refreshData();
        console.log("✅ [Food Details] Diet data refreshed successfully");
      }, 200);

      // Show success message
      Alert.alert("Success!", `${food.name} has been added to your diet.`, [
        {
          text: "Go to Home",
          onPress: () => router.replace("/"),
        },
        {
          text: "Add Another",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("❌ [Food Details] Error adding food to diet:", error);
      Alert.alert("Error", "Failed to add food to diet. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsAddingToDiet(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {/* Header with Image */}
      <View className="relative">
        {/* Use current image (captured, selected, or original) */}
        {currentImage ? (
          <View className="relative">
            <Image
              source={{ uri: currentImage }}
              className="w-full h-80"
              resizeMode="cover"
            />
          </View>
        ) : food?.image ? (
          <ImageBackground source={food.image} className="w-full h-80">
            {/* Top Navigation */}
            <View className="flex-row justify-between items-center pt-12 px-4">
              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={handleFavoriteToggle}
              >
                {food &&
                isFavorite(Array.isArray(food.id) ? food.id[0] : food.id) ? (
                  <icons.heartFill width={16} height={16} />
                ) : (
                  <icons.heart width={16} height={16} />
                )}
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ) : (
          // Fallback for foods without images
          <ImageBackground
            source={images.fallback_food}
            className="w-full h-80 "
          >
            {/* Top Navigation */}
            <View className="flex-row justify-between items-center pt-12 px-4">
              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={handleFavoriteToggle}
              >
                {food &&
                isFavorite(Array.isArray(food.id) ? food.id[0] : food.id) ? (
                  <icons.heartFill width={16} height={16} />
                ) : (
                  <icons.heart width={16} height={16} />
                )}
              </TouchableOpacity>
            </View>

            {/* Placeholder content */}
            <View className="items-center justify-center flex-1">
              <Ionicons name="nutrition" size={80} color="white" />
              <Text className="text-white text-lg font-semibold mt-2">
                Food Image
              </Text>
            </View>
          </ImageBackground>
        )}

        {/* If current image exists, overlay navigation on top */}
        {currentImage && (
          <View className="absolute top-0 left-0 right-0 pt-12 px-4 pb-4">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                onPress={handleFavoriteToggle}
              >
                {food &&
                isFavorite(Array.isArray(food.id) ? food.id[0] : food.id) ? (
                  <icons.heartFill width={16} height={16} />
                ) : (
                  <icons.heart width={16} height={16} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Edit button positioned at bottom right of image */}
        <TouchableOpacity
          className="absolute bottom-8 right-4 w-12 h-12 bg-orange-500 rounded-full items-center justify-center shadow-lg"
          onPress={handleImagePress}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-6">
        {/* Title Section */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {food.name}
          </Text>
          {/* Show saving status */}
          {isSavingImage && (
            <View className="flex-row items-center mb-2">
              <ActivityIndicator size="small" color="#ff5a16" />
              <Text className="ml-2 text-orange-600 text-sm font-medium">
                Saving image changes...
              </Text>
            </View>
          )}
          <Text className="text-gray-600 leading-relaxed">
            {food.description}
          </Text>
          {/* Show source information for API-recognized foods */}
          {"source" in food && food.source && (
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={
                  food.source === "gemini"
                    ? "sparkles"
                    : food.source === "openfoodfacts"
                      ? "barcode"
                      : "information-circle"
                }
                size={16}
                color="#666"
              />
              <Text className="text-gray-500 text-sm ml-2 capitalize">
                Recognized by{" "}
                {food.source === "gemini"
                  ? "AI"
                  : food.source === "openfoodfacts"
                    ? "Barcode Database"
                    : food.source}
              </Text>
            </View>
          )}
        </View>

        {/* Macro Cards Grid */}
        <View className="mb-6">
          {/* Top Row - Calories and Protein */}
          <View className="flex-row mb-3">
            <MacroCard
              title="Calories"
              value={`${(food.calories || 0).toLocaleString()} kcal`}
              backgroundColor="bg-purple-200"
            />
            <MacroCard
              title="Protein"
              value={`${food.protein || 0}g`}
              percentage={proteinPercentage}
              backgroundColor="bg-green-300"
            />
          </View>

          {/* Bottom Row - Carbs and Fat */}
          <View className="flex-row">
            <MacroCard
              title="Carbs"
              value={`${food.carbs || 0}g`}
              percentage={carbsPercentage}
              backgroundColor="bg-yellow-300"
            />
            <MacroCard
              title="Fat"
              value={`${food.fat || 0}g`}
              percentage={fatPercentage}
              backgroundColor="bg-orange-400"
              textColor="text-white"
            />
          </View>
        </View>

        {/* Goal Section */}
        <GoalCard />

        {/* Add some bottom padding to ensure content doesn't get hidden behind the fixed button */}
        <View className="h-20" />
      </ScrollView>

      {/* Fixed Add to Diet Button at bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 mb-8">
        <CustomButton
          label={isAddingToDiet ? "Adding..." : "Add to My Diet"}
          onPress={handleAddToDiet}
          disabled={isAddingToDiet}
        />
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
        >
          <View className="bg-white rounded-2xl mx-8 p-6 w-80">
            <Text className="text-lg font-semibold text-center mb-4">
              Change Food Image
            </Text>
            <TouchableOpacity
              className="py-4 border-b border-gray-200"
              onPress={handleGalleryPress}
            >
              <Text className="text-center text-blue-600 text-lg">
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-4 border-b border-gray-200"
              onPress={takePhoto}
            >
              <Text className="text-center text-blue-600 text-lg">
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-4"
              onPress={() => setShowImageOptions(false)}
            >
              <Text className="text-center text-red-600 text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCameraModal}
        transparent={false}
        animationType="slide"
        onRequestClose={closeCameraModal}
      >
        <View className="flex-1 bg-black">
          {cameraPermission ? (
            <>
              <CameraView
                ref={(ref) => setCameraRef(ref)}
                style={{ flex: 1 }}
                facing="back"
              />
              <View className="absolute bottom-0 left-0 right-0 pb-8 pt-4">
                <View className="flex-row justify-center items-center px-8">
                  <TouchableOpacity
                    onPress={closeCameraModal}
                    className="absolute left-8"
                  >
                    <Ionicons name="close" size={32} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCameraCapture}
                    className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
                  >
                    <View className="w-16 h-16 bg-white rounded-full" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white text-lg">Loading camera...</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default FoodDetails;
