import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; // <-- Import DocumentPicker

// icon defined here
const backArrowIcon = require('../assets/icons/back-arrow.png');
const chatIcon = require('../assets/icons/chat-icon.png');
const fileIcon = require('../assets/icons/file-icon.png');
const screenshotIcon = require('../assets/icons/screenshot-icon.png');
const attachmentIcon = require('../assets/icons/attachment-icon.png');
const sendIcon = require('../assets/icons/send-icon.png');


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  author?: string;
  timestamp?: string;
  readStatus?: 'Read' | null;
  imageUri?: string; // <-- ADD THIS LINE
}

// Helper interface to standardize assets from different pickers
interface PickerAsset {
  uri: string;
  fileName: string;
  mimeType: string;
}

const API_URL = `http://nutritor-ai.onrender.com/api/v1/chat`;


const ChatScreen = () => {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAttachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state
  const flatListRef = useRef<FlatList<Message>>(null);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    setClientId(Date.now().toString() + Math.random().toString(36).substr(2));
  }, []);

  const getCurrentTimestamp = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleStartChat = () => {
    setMessages([
      { id: '1', author: 'Livechat', timestamp: getCurrentTimestamp(), text: 'Hello! Nice to meet you!', sender: 'bot' },
      { id: '2', text: 'Welcome to LiveChat.\nPlease type down a question, and I will answer right away!', sender: 'bot' },
    ]);
    setIsChatStarted(true);
  };

  const sendData = async (prompt: string, asset?: PickerAsset) => {
    if ((!prompt || prompt.trim() === '') && !asset) return;

    setIsLoading(true);
    setAttachmentMenuVisible(false);

    // Immediately add the user's message (with image) to the chat UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: 'user',
      author: 'Visitor',
      timestamp: getCurrentTimestamp(),
      readStatus: 'Read',
      imageUri: asset?.uri, // Display the local image URI
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Use FormData to package text and files for sending
    const formData = new FormData();
    formData.append('clientId', clientId);
    formData.append('prompt', prompt);

    if (asset) {
      const fileData: any = {
        uri: asset.uri,
        name: asset.fileName,
        type: asset.mimeType,
      };
      formData.append('image', fileData);
    }
    
    try {
      // The fetch call is now much simpler. NO manual headers.
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      const botMessage: Message = {
        id: Date.now().toString() + 'b',
        text: data.text,
        sender: 'bot',
        author: 'Livechat',
        timestamp: getCurrentTimestamp(),
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending data:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + 'e',
        text: "Sorry, I couldn't connect to the server.",
        sender: 'bot',
        author: 'Livechat',
        timestamp: getCurrentTimestamp(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  // --- (CHANGE 3) - MODIFIED IMAGE & FILE HANDLERS ---
  // These now call the new `sendData` function.
  const handleAttachImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access the photo library is required!");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!pickerResult.canceled) {
      const asset = pickerResult.assets[0];
      const pickerAsset: PickerAsset = { uri: asset.uri, fileName: asset.fileName || 'photo.jpg', mimeType: asset.mimeType || 'image/jpeg' };
      // Send the image with a default prompt
      sendData("Please analyze the nutrition in this image.", pickerAsset);
    }
  };

  const handleAttachFile = async () => {
    const pickerResult = await DocumentPicker.getDocumentAsync();
    if (pickerResult.assets && pickerResult.assets.length > 0) {
      const asset = pickerResult.assets[0];
      const pickerAsset: PickerAsset = { uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType || 'application/octet-stream' };
      // Send the file with a default prompt
      sendData(`Please analyze this document: ${asset.name}`, pickerAsset);
    }
  };

  // --- (CHANGE 4) - UPDATED RENDER FUNCTION ---
  // It now knows how to display an image if `imageUri` exists.
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={styles.messageRow}>
        {item.author && (
          <View style={[styles.metadataContainer, isUser ? styles.userMetadata : styles.botMetadata]}>
            {!isUser && <View style={styles.livechatIcon} />}
            <Text style={styles.metadataText}>{item.author} {item.timestamp}</Text>
          </View>
        )}
        {/* Render the image if it exists */}
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.chatImage} />
        )}
        {/* Render the text bubble if text exists */}
        {item.text && item.text.trim() !== '' && (
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble, item.imageUri ? { marginTop: 8 } : {}]}>
            <Text style={isUser ? styles.userMessageText : styles.botMessageText}>{item.text}</Text>
          </View>
        )}
        {item.readStatus && isUser && <Text style={styles.readStatus}>{item.readStatus}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backArrowContainer}><Image source={backArrowIcon} style={styles.backArrow} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Nutritor AI</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={(Platform.OS === 'ios' || Platform.OS === 'android') ? 50 : 0}>
        {!isChatStarted ? (
          <View style={styles.startContainer}><View style={styles.startBox}><Image source={chatIcon} style={styles.startIcon} /><Text style={styles.startTitle}>Hello Nice to see you here!</Text><Text style={styles.startSubtitle}>By pressing the "Start chat" button you agree to have your personal data processed as described in our{' '}<Text style={styles.privacyLink} onPress={() => Linking.openURL('https://ik.imagekit.io/ltdsword/suss.jpg?updatedAt=1756314071583')}>Privacy Policy</Text></Text><TouchableOpacity style={styles.startButton} onPress={handleStartChat}><Text style={styles.startButtonText}>Start chat</Text></TouchableOpacity></View></View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessageItem}
              style={styles.messageList}
              contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
            />
            {isLoading && <ActivityIndicator style={{ marginVertical: 10 }} size="large" color="#FF5A16" />}
            <View style={styles.inputArea}>
              {isAttachmentMenuVisible && (
                <View style={styles.attachmentMenuContainer}>
                  <View style={styles.attachmentMenu}>
                    {/* --- (CHANGE 5) - WIRED UP FILE PICKER --- */}
                    <TouchableOpacity style={styles.menuOption} onPress={handleAttachFile}>
                      <Image source={fileIcon} style={styles.menuIcon} />
                      <Text style={styles.menuOptionText}>Send File</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuOption} onPress={handleAttachImage}>
                      <Image source={screenshotIcon} style={styles.menuIcon} />
                      <Text style={styles.menuOptionText}>Attach a screenshot</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.menuPointer} />
                </View>
              )}
              <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Write a message" placeholderTextColor="#888" onFocus={() => setAttachmentMenuVisible(false)} />
                <TouchableOpacity onPress={() => setAttachmentMenuVisible(prev => !prev)}><Image source={attachmentIcon} style={styles.icon} /></TouchableOpacity>
                {/* Send button now calls the unified `sendData` function */}
                <TouchableOpacity onPress={() => sendData(input)}><Image source={sendIcon} style={styles.icon} /></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff' },
  backArrowContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  backArrow: { width: 20, height: 20, tintColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  startBox: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF' },
  startIcon: { width: 60, height: 60, marginBottom: 20 },
  startTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  startSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  privacyLink: { color: '#FF5A16', textDecorationLine: 'underline' },
  startButton: { backgroundColor: '#FF5A16', paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  messageList: { flex: 1, paddingHorizontal: 15 },
  messageRow: { marginBottom: 10 },
  metadataContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  botMetadata: { justifyContent: 'flex-start' },
  userMetadata: { justifyContent: 'flex-end' },
  livechatIcon: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A16', marginRight: 8 },
  metadataText: { fontSize: 12, color: '#888' },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 18, maxWidth: '80%' },
  botBubble: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEFEF', alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#FF5A16', alignSelf: 'flex-end', borderTopRightRadius: 4 },
  botMessageText: { fontSize: 15, color: '#000' },
  userMessageText: { fontSize: 15, color: '#fff' },
  chatImage: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 18,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  readStatus: { fontSize: 12, color: '#888', alignSelf: 'flex-end', marginTop: 4 },
  inputArea: { position: 'relative', backgroundColor: '#fff' },
  attachmentMenuContainer: { position: 'absolute', bottom: 60, left: 15, right: 15, alignItems: 'flex-end' },
  attachmentMenu: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EFEFEF', width: '60%', padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  menuPointer: { position: 'absolute', bottom: -10, right: 55, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF' },
  menuOption: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  menuIcon: { width: 22, height: 22, marginRight: 10, tintColor: '#555' },
  menuOptionText: { fontSize: 16, color: '#333' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  input: { flex: 1, height: 40, fontSize: 16, paddingHorizontal: 10 },
  icon: { width: 24, height: 24, marginHorizontal: 8, tintColor: '#888' },
});

export default ChatScreen;