import { authInstance } from "@/config/api/axios"; // Import auth instance for API calls
import { useAnalytics } from "@/context/AnalyticsContext"; // Import analytics context for weight updates
import { useDietContext } from "@/context/DietContext"; // Import diet context for refreshing data
import { analyticsEventEmitter } from "@/utils/analyticsEvents"; // Import analytics event emitter
import ImageUtils from "@/utils/ImageUtils";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomHeaderWithBack from "./CustomHeaderWithBack";
import { Text } from "./CustomText";
import GoalAchievedModal from "./GoalAchievedModal"; // Import goal achievement modal

// icon defined here
import { icons } from "@/constants/icons";
import { useIsDark } from "@/theme/useIsDark";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  author?: string;
  timestamp?: string;
  readStatus?: "Read" | null;
  imageUri?: string; // <-- ADD THIS LINE
}

// Helper interface to standardize assets from different pickers
interface PickerAsset {
  uri: string;
  fileName: string;
  mimeType: string;
}

const API_URL = `chat`; // Correct path for authInstance (baseURL already includes /api/v1/)

const ChatScreen = () => {
  const isDark = useIsDark();
  const router = useRouter();
  const { refreshDietData } = useDietContext(); // Get diet refresh function
  const {
    refreshAnalytics,
    invalidateAnalytics,
    showGoalAchievedModal,
    setShowGoalAchievedModal,
  } = useAnalytics(); // Get analytics refresh functions and modal state

  const [isChatStarted, setIsChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAttachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state
  const [isRefreshingData, setIsRefreshingData] = useState(false); // Loading state for data refresh

  // Modal handlers for goal achievement
  const handleCloseGoalModal = () => {
    setShowGoalAchievedModal(false);
  };

  const handleSetNewGoal = () => {
    // The modal will handle navigation to goal setting
    setShowGoalAchievedModal(false);
  };

  // Debug: Monitor goal achievement modal state
  useEffect(() => {
    console.log(
      "🎯 [ChatScreen] Goal achievement modal state:",
      showGoalAchievedModal
    );
  }, [showGoalAchievedModal]);

  // Handle new chat creation
  const handleNewChat = () => {
    // If chat is already started and has messages, show confirmation
    if (isChatStarted && messages.length > 0) {
      Alert.alert(
        "Start New Chat",
        "Are you sure you want to start a new chat? Your current conversation will be cleared.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "New Chat",
            style: "destructive",
            onPress: () => {
              startNewChatSession();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      // If no messages yet, start new chat directly
      startNewChatSession();
    }
  };

  // Helper function to actually start new chat
  const startNewChatSession = () => {
    setMessages([]);
    setIsChatStarted(false);
    setInput("");
    console.log("🆕 Started new chat session");
  };

  // Function to refresh diet data when agent performs diet operations
  const handleDietDataRefresh = async (
    botResponse: string,
    goalAchievementData?: any
  ) => {
    try {
      // Check if the bot response indicates diet modifications
      const dietKeywords = [
        "added to your diet for today",
        "removed from your diet",
        "added to your diet",
        "removed from your diet",
        "deleted from your diet",
        "added to diet",
        "removed from diet",
        "food has been added",
        "food has been removed",
        "successfully added",
        "successfully removed",
        "diet updated",
        "diet modified",
      ];

      // Check if the bot response indicates weight updates - REMOVED TO MAKE WEIGHT UPDATES SILENT
      // Weight updates are now handled silently like other profile updates
      // const weightKeywords = [
      //   "weight updated",
      //   "weight has been updated",
      //   "current weight is now",
      //   "weight set to",
      //   "congratulations",
      //   "goal achieved",
      //   "reached your goal",
      // ];

      const shouldRefreshDiet = dietKeywords.some((keyword) =>
        botResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      // Removed weight refresh logic to make weight updates silent like other profile updates
      // const shouldRefreshWeight = weightKeywords.some((keyword) =>
      //   botResponse.toLowerCase().includes(keyword.toLowerCase())
      // );

      // Check for goal achievement from metadata
      if (goalAchievementData) {
        console.log(
          "🎯 Goal achievement detected from chat response:",
          goalAchievementData
        );
        analyticsEventEmitter.emitWeightGoalAchieved(
          goalAchievementData.currentWeight,
          goalAchievementData.goalWeight,
          goalAchievementData.unit
        );
      }

      if (shouldRefreshDiet) {
        setIsRefreshingData(true); // Show refresh indicator
      }

      if (shouldRefreshDiet) {
        console.log("🔄 Diet modification detected, refreshing diet data...");
        // Refresh current day's diet data
        await refreshDietData(new Date(), true); // force refresh
        // Also invalidate analytics to refresh nutrition data
        invalidateAnalytics();
        console.log("✅ Diet data refreshed successfully");
      }

      // Weight updates are now handled silently - no loading animations

      // If diet was updated, also refresh analytics after a short delay
      if (shouldRefreshDiet) {
        setTimeout(async () => {
          try {
            await refreshAnalytics();
            console.log("✅ Analytics data refreshed after diet change");
          } catch (error) {
            console.error("❌ Error in delayed analytics refresh:", error);
          } finally {
            setIsRefreshingData(false); // Hide refresh indicator
          }
        }, 1000); // 1 second delay to allow backend to process
      }
    } catch (error) {
      console.error("❌ Error refreshing diet data:", error);
      setIsRefreshingData(false); // Hide refresh indicator on error
    }
  };

  // Create + button component for new chat
  const NewChatButton = () => (
    <TouchableOpacity
      onPress={handleNewChat}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FF5A16",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold" }}>
        +
      </Text>
    </TouchableOpacity>
  );
  const flatListRef = useRef<FlatList<Message>>(null);
  const [clientId, setClientId] = useState<string>("");

  // Auto-scroll function
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    setClientId(Date.now().toString() + Math.random().toString(36).substr(2));
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Auto-scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  const getCurrentTimestamp = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleStartChat = () => {
    setMessages([
      {
        id: "1",
        author: "NutritorAI",
        timestamp: getCurrentTimestamp(),
        text: "Hello! I'm your personal NutritorAI Agent!",
        sender: "bot",
      },
      {
        id: "2",
        text: "I can help you with:\n• Search for foods in the current food list\n• Check nutrition information for specific foods\n• View and manage your daily diet\n• Track and update weight progress\n• Check goal achievement\n• View and update user profile information\n\nWhat would you like to know?",
        sender: "bot",
      },
    ]);
    setIsChatStarted(true);
    // Auto-scroll after chat starts
    setTimeout(() => scrollToBottom(), 200);
  };

  const sendData = async (prompt: string, asset?: PickerAsset) => {
    if ((!prompt || prompt.trim() === "") && !asset) return;

    setIsLoading(true);
    setAttachmentMenuVisible(false);

    // Immediately add the user's message (with image) to the chat UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: "user",
      author: "Visitor",
      timestamp: getCurrentTimestamp(),
      readStatus: "Read",
      imageUri: asset?.uri, // Display the local image URI
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // ✅ Use ImageUtils for image processing
    let finalAssetUri = asset?.uri;
    let processedSuccessfully = false;

    if (asset && asset.mimeType.startsWith("image/")) {
      try {
        console.log("🔄 Processing image with ImageUtils...");
        const processResult = await ImageUtils.processImageForUpload(asset.uri);

        finalAssetUri = processResult.uri;
        processedSuccessfully = processResult.compressed;

        console.log("✅ Chat image processing result:", {
          originalUri: asset.uri,
          processedUri: processResult.uri,
          width: processResult.width,
          height: processResult.height,
          compressed: processResult.compressed,
        });
      } catch (error) {
        console.warn("⚠️ Chat image processing failed, using original:", error);
        finalAssetUri = asset.uri;
        processedSuccessfully = false;
      }
    }

    // Use FormData to package text and files for sending
    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("prompt", prompt);

    if (asset && finalAssetUri) {
      // Validate image URI before creating FormData
      if (
        asset.mimeType.startsWith("image/") &&
        ImageUtils.isValidImageUri(finalAssetUri)
      ) {
        // Use ImageUtils for consistent FormData creation
        const imageFormData = ImageUtils.createImageFormData(
          finalAssetUri,
          "image"
        );
        // Get the image data from the ImageUtils FormData and append to our main FormData
        const imageData = (imageFormData as any)._parts[0][1];
        formData.append("image", imageData);
      } else {
        // For non-image files, use the original approach
        const fileData: any = {
          uri: finalAssetUri,
          name: asset.fileName,
          type: asset.mimeType,
        };
        formData.append("image", fileData);
      }

      console.log(
        `📦 Chat FormData created with ${processedSuccessfully ? "processed" : "original"} ${asset.mimeType.startsWith("image/") ? "image" : "file"}`
      );
    }

    try {
      console.log("🚀 Sending chat message to API...");
      console.log(
        "📡 Chat backend URL:",
        `${authInstance.defaults.baseURL}${API_URL}`
      );
      console.log("📝 API endpoint path:", API_URL);

      // Use authInstance for authenticated requests to the agent with longer timeout
      const response = await authInstance.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 60 seconds timeout for AI responses
      });

      console.log(`📡 Chat API response status: ${response.status}`);
      const data = response.data;
      console.log("✅ Chat API response received successfully");

      const botMessage: Message = {
        id: Date.now().toString() + "b",
        text: data.text,
        sender: "bot",
        author: "NutritorAI",
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, botMessage]);

      // 🔄 Refresh diet data if the response indicates diet changes
      await handleDietDataRefresh(data.text, data.goalAchieved);
    } catch (error: any) {
      console.error("💥 Error in chat sendData:", error);

      // ✅ Fallback: Try with original image if processing failed
      if (
        error?.message?.includes("processing failed") &&
        asset &&
        processedSuccessfully
      ) {
        console.log("🔄 Falling back to original image in chat...");
        try {
          const fallbackFormData = new FormData();
          fallbackFormData.append("clientId", clientId);
          fallbackFormData.append("prompt", prompt);

          if (asset) {
            if (
              asset.mimeType.startsWith("image/") &&
              ImageUtils.isValidImageUri(asset.uri)
            ) {
              // Use ImageUtils for consistent fallback FormData creation
              const imageFormData = ImageUtils.createImageFormData(
                asset.uri,
                "image"
              );
              const imageData = (imageFormData as any)._parts[0][1];
              fallbackFormData.append("image", imageData);
            } else {
              // For non-image files, use the original approach
              const originalFileData: any = {
                uri: asset.uri,
                name: asset.fileName,
                type: asset.mimeType,
              };
              fallbackFormData.append("image", originalFileData);
            }
          }

          console.log(
            "🔄 Attempting fallback request to:",
            `${authInstance.defaults.baseURL}${API_URL}`
          );
          const fallbackResponse = await authInstance.post(
            API_URL,
            fallbackFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000, // 60 seconds timeout for AI responses
            }
          );

          const fallbackData = fallbackResponse.data;
          console.log("✅ Chat fallback request successful");

          const botMessage: Message = {
            id: Date.now().toString() + "b",
            text: fallbackData.text,
            sender: "bot",
            author: "NutritorAI",
            timestamp: getCurrentTimestamp(),
          };
          setMessages((prev) => [...prev, botMessage]);

          // 🔄 Refresh diet data if the fallback response indicates diet changes
          await handleDietDataRefresh(
            fallbackData.text,
            fallbackData.goalAchieved
          );

          return; // Exit early on success
        } catch (fallbackError) {
          console.error("❌ Chat fallback also failed:", fallbackError);
        }
      }

      // ✅ Standard error handling with detailed server error info
      console.error("❌ Chat request failed:", error);
      console.error("❌ Error status:", error?.response?.status);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Server response:", error?.response?.data);

      let errorText =
        "Sorry, I couldn't connect to the server. Please try again.";

      if (error?.response?.status === 500) {
        errorText =
          "Server error detected. The AI service might be temporarily unavailable. Please check if all required API keys are configured on the server.";
      } else if (error?.response?.status === 404) {
        errorText =
          "Chat endpoint not found. Please check the server configuration.";
      } else if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        errorText = "Authentication error. Please try logging in again.";
      } else if (error?.message?.includes("Network request failed")) {
        errorText =
          "Connection error. Please check your internet and try again.";
      } else if (error?.message?.includes("timeout")) {
        errorText =
          "Request timed out. The AI is taking longer than expected. Please try again.";
      }

      const errorMessage: Message = {
        id: Date.now().toString() + "e",
        text: errorText,
        sender: "bot",
        author: "NutritorAI",
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  // --- (CHANGE 3) - MODIFIED IMAGE & FILE HANDLERS ---
  // These now call the new `sendData` function.
  const handleAttachImage = async () => {
    console.log("📷 Chat: Image attachment requested");
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      console.warn("⚠️ Chat: Photo library permission denied");
      alert("Permission to access the photo library is required!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // Start with high quality, we'll compress it
    });

    if (!pickerResult.canceled) {
      const asset = pickerResult.assets[0];
      console.log("📸 Chat: Image selected:", {
        uri: asset.uri,
        fileName: asset.fileName || "photo.jpg",
        mimeType: asset.mimeType || "image/jpeg",
        width: asset.width,
        height: asset.height,
      });

      const pickerAsset: PickerAsset = {
        uri: asset.uri,
        fileName: asset.fileName || "photo.jpg",
        mimeType: asset.mimeType || "image/jpeg",
      };
      // Send the image with a default prompt
      sendData("Please analyze the nutrition in this image.", pickerAsset);
    } else {
      console.log("📷 Chat: Image selection cancelled");
    }
  };

  const handleAttachFile = async () => {
    console.log("📄 Chat: File attachment requested");
    const pickerResult = await DocumentPicker.getDocumentAsync();
    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      console.log("📎 Chat: File selected:", {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
      });

      const pickerAsset: PickerAsset = {
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
      };
      // Send the file with a default prompt
      sendData(`Please analyze this document: ${asset.name}`, pickerAsset);
    } else {
      console.log("📄 Chat: File selection cancelled");
    }
  };

  // --- (CHANGE 4) - UPDATED RENDER FUNCTION ---
  // It now knows how to display an image if `imageUri` exists.
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user"; // Assuming useIsDark is imported and available

    return (
      <View style={styles.messageRow}>
        {item.author && (
          <View
            style={[
              styles.metadataContainer,
              isUser ? styles.userMetadata : styles.botMetadata,
            ]}
          >
            {!isUser && <View style={styles.livechatIcon} />}
            <Text
              style={[styles.metadataText, isDark && styles.metadataTextDark]}
            >
              {item.author} {item.timestamp}
            </Text>
          </View>
        )}
        {/* Render the image if it exists */}
        {item.imageUri && (
          <Image
            source={{ uri: item.imageUri }}
            style={[styles.chatImage, isDark && styles.chatImageDark]}
          />
        )}
        {/* Render the text bubble if text exists */}
        {item.text && item.text.trim() !== "" && (
          <View
            style={[
              styles.messageBubble,
              isUser
                ? styles.userBubble
                : [styles.botBubble, isDark && styles.botBubbleDark],
              item.imageUri ? { marginTop: 8 } : {},
            ]}
          >
            <Text
              style={
                isUser
                  ? styles.userMessageText
                  : [styles.botMessageText, isDark && styles.botMessageTextDark]
              }
            >
              {item.text}
            </Text>
          </View>
        )}
        {item.readStatus && isUser && (
          <Text style={[styles.readStatus, isDark && styles.readStatusDark]}>
            {item.readStatus}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <CustomHeaderWithBack
        title="NutritorAI Agent"
        rightComponent={<NewChatButton />}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
      >
        {!isChatStarted ? (
          <View style={styles.startContainer}>
            <View style={[styles.startBox, isDark && styles.startBoxDark]}>
              <icons.chatIcon width={60} height={60} className="mb-5" />
              <Text
                style={[styles.startTitle, isDark && styles.startTitleDark]}
                className="mt-3"
              >
                Meet Your NutritorAI Agent!
              </Text>
              <Text
                style={[
                  styles.startSubtitle,
                  isDark && styles.startSubtitleDark,
                ]}
              >
                Your intelligent nutrition assistant that can analyze food
                images, manage your diet, track weight progress, and provide
                personalized nutrition guidance.
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartChat}
              >
                <Text style={styles.startButtonText}>Start Agent Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              style={styles.messageList}
              contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
              onContentSizeChange={() => scrollToBottom()}
              onLayout={() => scrollToBottom()}
            />
            {isLoading && (
              <ActivityIndicator
                style={{ marginVertical: 10 }}
                size="large"
                color="#FF5A16"
              />
            )}
            {isRefreshingData && (
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <ActivityIndicator size="small" color="#FF5A16" />
                <Text
                  style={[
                    styles.refreshingText,
                    isDark && styles.refreshingTextDark,
                  ]}
                >
                  Refreshing your data...
                </Text>
              </View>
            )}
            <View style={[styles.inputArea, isDark && styles.inputAreaDark]}>
              {isAttachmentMenuVisible && (
                <View style={styles.attachmentMenuContainer}>
                  <View
                    style={[
                      styles.attachmentMenu,
                      isDark && styles.attachmentMenuDark,
                    ]}
                  >
                    {/* Upper half with orange background */}
                    <View
                      style={[
                        styles.menuOptionHalf,
                        isDark && styles.menuOptionHalfDark,
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.menuOption]}
                        onPress={handleAttachFile}
                      >
                        <icons.fileIcon
                          width={22}
                          height={22}
                          className="mr-2.5"
                          color="#ffffff"
                          stroke="#ffffff"
                        />
                        <Text
                          style={[
                            styles.menuOptionText,
                            styles.menuOptionTextWhite,
                          ]}
                        >
                          Send File
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {/* Lower half with white background */}
                    <View
                      style={[
                        styles.menuOptionHalfLower,
                        isDark && styles.menuOptionHalfLowerDark,
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.menuOption]}
                        onPress={handleAttachImage}
                      >
                        <icons.screenShotIcon
                          width={22}
                          height={22}
                          className="mr-2.5"
                          stroke="#555"
                          color={isDark ? "white" : "#555"}
                        />
                        <Text
                          style={[
                            styles.menuOptionText,
                            isDark && styles.menuOptionTextDark,
                          ]}
                        >
                          Attach a screenshot
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.menuPointer,
                      isDark && styles.menuPointerDark,
                    ]}
                  />
                </View>
              )}
              <View
                style={[
                  styles.inputContainer,
                  isDark && styles.inputContainerDark,
                ]}
              >
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Write a message"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#888"}
                  onFocus={() => {
                    setAttachmentMenuVisible(false);
                    setTimeout(() => scrollToBottom(), 300);
                  }}
                />
                <TouchableOpacity
                  onPress={() => setAttachmentMenuVisible((prev) => !prev)}
                  style={{ marginRight: 16 }}
                >
                  <icons.attachmentIcon
                    width={24}
                    height={24}
                    className="mx-2"
                    stroke={isDark ? "#9CA3AF" : "#888"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => sendData(input)}
                  style={{ marginRight: 16 }}
                >
                  <icons.sendIcon
                    width={24}
                    height={24}
                    className="mx-2"
                    stroke={isDark ? "#9CA3AF" : "#888"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Goal Achievement Modal */}
      <GoalAchievedModal
        visible={showGoalAchievedModal}
        onClose={handleCloseGoalModal}
        onSetNewGoal={handleSetNewGoal}
      />
    </SafeAreaView>
  );
};

// --- (CHANGE 6) - ADDED STYLE FOR CHAT IMAGE ---
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  // Start chat section
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  startBox: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  startBoxDark: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
  },
  startTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#1F2937",
  },
  startTitleDark: {
    color: "#FFFFFF",
  },
  startSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  startSubtitleDark: {
    color: "#9CA3AF",
  },
  privacyLink: {
    color: "accent dark:accent-dark",
    textDecorationLine: "underline",
  },
  startButton: {
    backgroundColor: "#FF5A16",
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  startButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  // Message list
  messageList: { flex: 1, paddingHorizontal: 15 },
  // Loading status text
  refreshingText: {
    color: "#FF5A16",
    fontSize: 12,
    marginTop: 4,
  },
  refreshingTextDark: {
    color: "#FF5A16",
  },
  // Message bubbles and chat components
  messageRow: { marginBottom: 10 },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  botMetadata: { justifyContent: "flex-start" },
  userMetadata: { justifyContent: "flex-end" },
  livechatIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5A16",
    marginRight: 8,
  },
  metadataText: { fontSize: 12, color: "#888" },
  metadataTextDark: {
    color: "#9CA3AF",
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    maxWidth: "80%",
  },
  botBubble: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },
  botBubbleDark: {
    backgroundColor: "#4B5563",
    borderColor: "#6B7280",
  },
  userBubble: {
    backgroundColor: "#FF5A16",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  botMessageText: {
    fontSize: 15,
    color: "#000000",
  },
  botMessageTextDark: {
    color: "#FFFFFF",
  },
  userMessageText: { fontSize: 15, color: "#FFFFFF" },
  chatImage: {
    width: "70%",
    aspectRatio: 1,
    borderRadius: 18,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "border-default dark:border-default-dark",
  },
  readStatus: {
    fontSize: 12,
    color: "text-secondary dark:text-secondary-dark",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  // Input area
  inputArea: {
    position: "relative",
  },
  inputAreaDark: {
    backgroundColor: "#1f2937",
  },
  attachmentMenuContainer: {
    position: "absolute",
    bottom: 60,
    left: 15,
    right: 15,
    alignItems: "flex-end",
    zIndex: 999,
  },
  attachmentMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: "60%",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    flexDirection: "column",
    height: 120,
  },
  attachmentMenuDark: {
    backgroundColor: "#374151",
    borderColor: "#4B5563",
    shadowColor: "#FFF",
    shadowOpacity: 0.1,
  },
  menuPointer: {
    position: "absolute",
    bottom: -10,
    right: 55,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  menuPointerDark: {
    borderTopColor: "#374151",
  },
  menuOptionHalf: {
    backgroundColor: "#ff5a16",
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
    marginRight: -8,
    marginTop: -8,
    paddingLeft: 8,
  },
  menuOptionHalfDark: {
    backgroundColor: "#ff5a16",
  },
  menuOptionHalfLower: {
    backgroundColor: "#ffffff",
    flex: 1,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8,
    marginRight: -8,
    marginBottom: -8,
    paddingLeft: 8,
  },
  menuOptionHalfLowerDark: {
    backgroundColor: "#374151",
  },
  menuOption: { flexDirection: "row", alignItems: "center", padding: 10 },
  menuOptionText: {
    fontSize: 16,
    color: "#000000",
  },
  menuOptionTextDark: {
    color: "#FFFFFF",
  },
  menuOptionTextWhite: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputContainerDark: {
    borderTopColor: "#4B5563",
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingHorizontal: 10,
    color: "#000000",
  },
  inputDark: {
    color: "#FFFFFF",
  },
  chatImageDark: {
    borderColor: "#4B5563",
  },
  readStatusDark: {
    color: "#9CA3AF",
  },
});

export default ChatScreen;
