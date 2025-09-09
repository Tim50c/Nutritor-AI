import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Linking,
  ActivityIndicator, // <-- Import ActivityIndicator for loading state
} from "react-native";
import { Text } from './CustomText';
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons"; // <-- Import DocumentPicker
import { useRouter } from "expo-router";
import ImageUtils from "@/utils/ImageUtils";
import CustomHeaderWithBack from "./CustomHeaderWithBack";

// icon defined here
import { icons } from "@/constants/icons";

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

const API_URL = `https://nutritor-ai.onrender.com/api/v1/chat`;

const ChatScreen = () => {
  const router = useRouter();
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isAttachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state
  const flatListRef = useRef<FlatList<Message>>(null);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    setClientId(Date.now().toString() + Math.random().toString(36).substr(2));
  }, []);

  const getCurrentTimestamp = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleStartChat = () => {
    setMessages([
      {
        id: "1",
        author: "Nutritor AI",
        timestamp: getCurrentTimestamp(),
        text: "Hello! Nice to meet you!",
        sender: "bot",
      },
      {
        id: "2",
        text: "Welcome to Nutritor AI.\nPlease type down a question, and I will answer right away!",
        sender: "bot",
      },
    ]);
    setIsChatStarted(true);
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
      // The fetch call is now much simpler. NO manual headers.
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      console.log(`📡 Chat API response status: ${response.status}`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      console.log("✅ Chat API response received successfully");

      const botMessage: Message = {
        id: Date.now().toString() + "b",
        text: data.text,
        sender: "bot",
        author: "Nutritor AI",
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, botMessage]);
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

          const fallbackResponse = await fetch(API_URL, {
            method: "POST",
            body: fallbackFormData,
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log("✅ Chat fallback request successful");

            const botMessage: Message = {
              id: Date.now().toString() + "b",
              text: fallbackData.text,
              sender: "bot",
              author: "Nutritor AI",
              timestamp: getCurrentTimestamp(),
            };
            setMessages((prev) => [...prev, botMessage]);
            return; // Exit early on success
          }
        } catch (fallbackError) {
          console.error("❌ Chat fallback also failed:", fallbackError);
        }
      }

      // ✅ Standard error handling
      const errorMessage: Message = {
        id: Date.now().toString() + "e",
        text: error?.message?.includes("Network request failed")
          ? "Connection error. Please check your internet and try again."
          : "Sorry, I couldn't connect to the server. Please try again.",
        sender: "bot",
        author: "Nutritor AI",
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
    const isUser = item.sender === "user";
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
            <Text style={styles.metadataText}>
              {item.author} {item.timestamp}
            </Text>
          </View>
        )}
        {/* Render the image if it exists */}
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.chatImage} />
        )}
        {/* Render the text bubble if text exists */}
        {item.text && item.text.trim() !== "" && (
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.botBubble,
              item.imageUri ? { marginTop: 8 } : {},
            ]}
          >
            <Text
              style={isUser ? styles.userMessageText : styles.botMessageText}
            >
              {item.text}
            </Text>
          </View>
        )}
        {item.readStatus && isUser && (
          <Text style={styles.readStatus}>{item.readStatus}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeaderWithBack title="Nutritor AI" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : 30
        }
      >
        {!isChatStarted ? (
          <View style={styles.startContainer}>
            <View style={styles.startBox}>
              <icons.chatIcon width={60} height={60} className="mb-5" />
              <Text style={styles.startTitle} className="mt-3">Hello! Nice to see you here!</Text>
              <Text style={styles.startSubtitle}>
                Start chatting with Nutritor AI, your personal nutrition assistant and get instant answers to your diet and health questions.
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartChat}
              >
                <Text style={styles.startButtonText}>Start chat</Text>
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
            />
            {isLoading && (
              <ActivityIndicator
                style={{ marginVertical: 10 }}
                size="large"
                color="#FF5A16"
              />
            )}
            <View style={styles.inputArea}>
              {isAttachmentMenuVisible && (
                <View style={styles.attachmentMenuContainer}>
                  <View style={styles.attachmentMenu}>
                    {/* Upper half with orange background */}
                    <View style={{
                      backgroundColor: '#ff5a16',
                      flex: 1,
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: -8,
                      marginRight: -8,
                      marginTop: -8,
                      paddingLeft: 8,
                    }}>
                      <TouchableOpacity
                        style={[styles.menuOption, { 
                          backgroundColor: 'transparent',
                          flex: 1,
                          width: '100%',
                          margin: 0
                        }]}
                        onPress={handleAttachFile}
                      >
                        <icons.fileIcon
                          width={22}
                          height={22}
                          className="mr-2.5"
                          color="#ffffff"
                          stroke="#ffffff"
                        />
                        <Text style={[styles.menuOptionText, { paddingLeft: 8, color: '#ffffff' }]}>Send File</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Lower half with white background */}
                    <View style={{
                      backgroundColor: '#ffffff',
                      flex: 1,
                      borderBottomLeftRadius: 18,
                      borderBottomRightRadius: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginLeft: -8,
                      marginRight: -8,
                      marginBottom: -8,
                      paddingLeft: 8,
                    }}>
                      <TouchableOpacity
                        style={[styles.menuOption, { 
                          flex: 1, 
                          width: '100%',
                          margin: 0
                        }]}
                        onPress={handleAttachImage}
                      >
                      <icons.screenShotIcon
                        width={22}
                        height={22}
                        className="mr-2.5"
                        stroke="#555"
                      />
                      <Text style={[styles.menuOptionText, { paddingLeft: 8 }]}>
                        Attach a screenshot
                      </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.menuPointer} />
                </View>
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Write a message"
                  placeholderTextColor="#888"
                  onFocus={() => setAttachmentMenuVisible(false)}
                />
                <TouchableOpacity
                  onPress={() => setAttachmentMenuVisible((prev) => !prev)}
                  style={{ marginRight: 16 }}
                >
                  <icons.attachmentIcon
                    width={24}
                    height={24}
                    className="mx-2"
                    stroke="#888"
                  />
                </TouchableOpacity>
                {/* Send button now calls the unified `sendData` function */}
                <TouchableOpacity 
                  onPress={() => sendData(input)}
                  style={{ marginRight: 16 }}
                  >
                  <icons.sendIcon
                    width={24}
                    height={24}
                    className="mx-2"
                    stroke="#888"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- (CHANGE 6) - ADDED STYLE FOR CHAT IMAGE ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  startBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  startTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  startSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  privacyLink: { color: "#FF5A16", textDecorationLine: "underline" },
  startButton: {
    backgroundColor: "#FF5A16",
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  startButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  messageList: { flex: 1, paddingHorizontal: 15 },
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
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    maxWidth: "80%",
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#FF5A16",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  botMessageText: { fontSize: 15, color: "#000" },
  userMessageText: { fontSize: 15, color: "#fff" },
  chatImage: {
    width: "70%",
    aspectRatio: 1,
    borderRadius: 18,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  readStatus: {
    fontSize: 12,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputArea: { position: "relative", backgroundColor: "#fff" },
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
    borderColor: "#EFEFEF",
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
  menuOption: { flexDirection: "row", alignItems: "center", padding: 10 },
  menuIcon: { width: 22, height: 22, marginRight: 10, tintColor: "#555" },
  menuOptionText: { fontSize: 16, color: "#333" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  input: { flex: 1, height: 40, fontSize: 16, paddingHorizontal: 10 },
  icon: { width: 24, height: 24, marginHorizontal: 8, tintColor: "#888" },
});

export default ChatScreen;
