// mobile/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, AppState, AppStateStatus } from "react-native";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentChange,
  updateDoc,
  doc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const defaultPreferences: NotificationPreferences = {
  mealReminders: {
    enabled: true,
    breakfast: {
      enabled: true,
      time: { hour: 8, minute: 0 },
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
    lunch: {
      enabled: true,
      time: { hour: 12, minute: 0 },
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
    dinner: {
      enabled: true,
      time: { hour: 18, minute: 0 },
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  },
  weeklyProgress: {
    enabled: true,
    time: { hour: 9, minute: 0 },
    day: "sunday",
  },
  goalAchievements: {
    enabled: true,
    time: { hour: 21, minute: 0 },
    days: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
  },
};

// Configure local notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const appState = AppState.currentState;
    const shouldShowInForeground = appState === "active";

    console.log(
      `🔔 Notification handler called - AppState: ${appState}, Show in foreground: ${shouldShowInForeground}`
    );

    if (Platform.OS === "android") {
      // For Android, show notifications in foreground
      return {
        shouldPlaySound: shouldShowInForeground,
        shouldSetBadge: true,
        shouldShowBanner: shouldShowInForeground,
        shouldShowList: shouldShowInForeground,
        shouldShowAlert: shouldShowInForeground,
        // Force foreground display on Android
        android: {
          priority: "high",
          sticky: false,
          showBigText: true,
        },
      };
    } else {
      // For iOS
      return {
        shouldPlaySound: shouldShowInForeground,
        shouldSetBadge: true,
        shouldShowBanner: shouldShowInForeground,
        shouldShowList: shouldShowInForeground,
        shouldShowAlert: shouldShowInForeground,
        ios: {
          _displayInForeground: shouldShowInForeground, // Show notifications when app is active
        },
      };
    }
  },
});

export type Notification = {
  id: string;
  message: string;
  read: boolean;
  title?: string;
  body?: string;
  type?: any;
  createdAt?: any;
};

export type NotificationPreferences = {
  mealReminders: {
    enabled: boolean;
    breakfast: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[]; // ['monday', 'tuesday', etc.]
    };
    lunch: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[];
    };
    dinner: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[];
    };
  };
  weeklyProgress: {
    enabled: boolean;
    time: { hour: number; minute: number }; // Updated to object
    day: string; // 'sunday', 'monday', etc.
  };
  goalAchievements: {
    enabled: boolean;
    time: { hour: number; minute: number }; // Updated to object
    days: string[]; // Days of week to check
  };
};

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  updatePreferences: (newPreferences: Partial<NotificationPreferences>) => void;
  startListening: () => void;
  stopListening: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isFirstLoadRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<NotificationPreferences>>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add this line
  const processedNotificationIds = useRef<Set<string>>(new Set());

  const hasUnread = notifications.some((n) => !n.read);

  //  Debounced batch updates
  const debouncedUpdatePreferences = useCallback(
    (newPreferences: Partial<NotificationPreferences>) => {
      // Merge with pending updates
      Object.assign(pendingUpdatesRef.current, newPreferences);

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        const updates = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {}; // Clear pending

        try {
          const user = auth.currentUser;
          if (!user) return;

          const finalPreferences = { ...preferences, ...updates };

          // Background API call (non-blocking)
          fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/preferences`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${await user.getIdToken()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(finalPreferences),
            }
          ).catch(console.error); // Silent fail for better UX

          // Update Firestore as backup
          await updateDoc(doc(db, "users", user.uid), {
            notificationPreferences: finalPreferences,
          });

          console.log("✅ Preferences synced to backend");
        } catch (error) {
          console.error("❌ Error syncing preferences:", error);
        }
      }, 1000); // Batch updates every 1 second
    },
    [preferences]
  );

  // Register for push notifications with Expo
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return null;
      }

      // Get Expo push token
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) {
          console.error("❌ Project ID not found in config");
          return null;
        }

        console.log("🔑 Getting Expo push token with project ID:", projectId);

        // Try to get push token, but don't fail if Firebase isn't initialized
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenData.data;
        console.log(
          "✅ Expo push token obtained:",
          token.substring(0, 50) + "..."
        );
      } catch (e: any) {
        console.error("❌ Error getting Expo push token:", e);
        // If it's a Firebase initialization error, return a mock token for development
        if (e.message.includes("FirebaseApp is not initialized")) {
          console.warn("⚠️ Using development mode - Firebase not initialized");
          return "development-token-" + Date.now();
        }
        return null;
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
      return null;
    }

    return token;
  };

  // Setup notification listeners
  useEffect(() => {
    let isMounted = true;

    // Track app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed from ${appState} to ${nextAppState}`);
      setAppState(nextAppState);

      // When app comes to foreground, clear processed notifications after a delay
      // This prevents duplicate notifications when returning to app
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        console.log(
          "🔄 App came to foreground, clearing processed notification IDs"
        );
        setTimeout(() => {
          processedNotificationIds.current.clear();
        }, 2000); // 2 second delay to allow any pending notifications to be processed
      }
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Register for push notifications when user is authenticated
    const setupPushNotifications = async () => {
      try {
        if (auth.currentUser) {
          console.log(
            "🚀 Setting up push notifications for user:",
            auth.currentUser.uid
          );
          const token = await registerForPushNotificationsAsync();

          if (token && token !== "undefined") {
            console.log(
              "💾 Saving push token to Firestore:",
              token.substring(0, 50) + "..."
            );
            // Save token to user document
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              expoPushToken: token,
              platform: Platform.OS,
              lastTokenUpdate: new Date(),
            });
            console.log("✅ Push token saved successfully");
          } else {
            console.warn("⚠️ No valid push token received");
          }
        }
      } catch (error) {
        console.error("❌ Error setting up push notifications:", error);
      }
    };

    setupPushNotifications();

    // Listen for notification responses (when user taps notification)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "📱 Notification received:",
          notification.request.content.title
        );
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "👆 Notification tapped:",
          response.notification.request.content.title
        );
        // You can handle navigation here based on notification data
      });

    return () => {
      isMounted = false;
      appStateSubscription?.remove();
      notificationListener.remove();
      responseListener.remove();
    };
  }, [appState]);

  // Trigger local notification
  const triggerLocalNotification = useCallback(async (notification: any) => {
    try {
      // Check if we've already processed this notification
      if (processedNotificationIds.current.has(notification.id)) {
        console.log(`🚫 Skipping duplicate notification: ${notification.id}`);
        return;
      }

      // Add to processed set
      processedNotificationIds.current.add(notification.id);

      const currentAppState = AppState.currentState;
      console.log(
        `🔔 Triggering local notification - App state: ${currentAppState}`
      );

      // Always schedule the notification, let the handler decide whether to show it
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Nutritor AI",
          body: notification.body || "You have a new notification",
          data: {
            ...notification.type,
            notificationId: notification.id,
            timestamp: Date.now(),
          },
          sound: "default",
        },
        trigger: null, // Show immediately
      });

      console.log(
        `✅ Local notification scheduled for ${Platform.OS} (App state: ${currentAppState}):`,
        notification.title
      );
    } catch (error) {
      console.error("❌ Error triggering local notification:", error);
    }
  }, []);

  // Better batching implementation
  const startListening = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const uid = currentUser.uid;
    console.log(`🔥 Starting optimized Firestore listener for:`, uid);
    setError(null);
    setLoading(true);

    // Stop existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      const notificationsRef = collection(db, "users", uid, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"));

      // Use ref to track batch timeout
      const pendingChanges: any[] = [];

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`📋 Firestore snapshot received - ${snapshot.docs.length} documents`);

          // Clear existing timeout
          if (batchTimeoutRef.current) {
            clearTimeout(batchTimeoutRef.current);
          }

          // Collect all changes
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const notification = {
              id: change.doc.id,
              title: data.title,
              body: data.body,
              message: data.message || `${data.title}: ${data.body}`,
              read: data.read || false,
              type: data.type,
              createdAt: data.createdAt,
            };

            if (change.type === "added") {
              pendingChanges.push({ type: "add", notification });
            } else if (change.type === "modified") {
              pendingChanges.push({ type: "modify", notification });
            }
          });

          // Process first load
          if (isFirstLoadRef.current && snapshot.docs.length > 0) {
            console.log(`🔄 First load - processing ${snapshot.docs.length} existing notifications`);
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              const notification = {
                id: doc.id,
                title: data.title,
                body: data.body,
                message: data.message || `${data.title}: ${data.body}`,
                read: data.read || false,
                type: data.type,
                createdAt: data.createdAt,
              };
              
              const existsInPending = pendingChanges.some(
                (change) => change.notification.id === notification.id
              );
              if (!existsInPending) {
                pendingChanges.push({ type: "add", notification });
              }
            });
          }

          // Batch process changes
          batchTimeoutRef.current = setTimeout(() => {
            if (pendingChanges.length > 0) {
              console.log(`⚡ Processing ${pendingChanges.length} pending changes`);
              
              setNotifications((prev) => {
                let updated = [...prev];

                pendingChanges.forEach(({ type, notification }) => {
                  if (type === "add") {
                    if (!updated.find((n) => n.id === notification.id)) {
                      updated.unshift(notification);
                      
                      // Trigger local notification logic
                      const isRecentNotification = notification.createdAt?.seconds
                        ? Date.now() / 1000 - notification.createdAt.seconds < 30
                        : true;

                      const shouldTriggerNotification =
                        !isFirstLoadRef.current &&
                        isRecentNotification &&
                        !processedNotificationIds.current.has(notification.id);

                      if (shouldTriggerNotification) {
                        triggerLocalNotification(notification);
                      }
                    }
                  } else if (type === "modify") {
                    const index = updated.findIndex((n) => n.id === notification.id);
                    if (index >= 0) {
                      updated[index] = notification;
                    }
                  }
                });

                return updated
                  .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                  .slice(0, 100);
              });

              // Clear pending changes
              pendingChanges.length = 0;
            }
            
            setLoading(false);
            setError(null);
            isFirstLoadRef.current = false;
          }, 200);
        },
        (error) => {
          console.error("❌ Firestore listener error:", error);
          setError(`Failed to load notifications: ${error.message}`);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error: any) {
      console.error("❌ Error setting up Firestore listener:", error);
      setError(`Failed to setup notifications: ${error.message}`);
      setLoading(false);
    }
  }, [triggerLocalNotification]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`🛑 Stopping Firestore listener`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Load cached preferences on startup
  useEffect(() => {
    const loadCachedPreferences = async () => {
      try {
        const cached = await AsyncStorage.getItem("notification_preferences");
        if (cached) {
          setPreferences(JSON.parse(cached));
        }
      } catch (error) {
        console.error("Failed to load cached preferences:", error);
      }
    };

    loadCachedPreferences();
  }, []);

  // Auto-start listener when user authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(
          `🚀 User authenticated, starting Firestore listener for:`,
          user.uid
        );
        console.log("📧 User email:", user.email);

        // Load user's notification preferences from backend
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/preferences`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${await user.getIdToken()}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.preferences) {
              console.log("📋 Loaded notification preferences from backend");
              setPreferences(data.data.preferences);
            }
          } else {
            console.warn(
              "⚠️ Failed to load notification preferences from backend"
            );
          }
        } catch (error) {
          console.error("❌ Error loading notification preferences:", error);
        }

        // Register for push notifications for the new user
        try {
          const token = await registerForPushNotificationsAsync();
          if (token && token !== "undefined") {
            console.log("💾 Updating push token for authenticated user");
            await updateDoc(doc(db, "users", user.uid), {
              expoPushToken: token,
              platform: Platform.OS,
              lastTokenUpdate: new Date(),
            });
            console.log("✅ Push token updated for user:", user.uid);
          }
        } catch (error) {
          console.error("❌ Error updating push token:", error);
        }

        // Reset state and start listening
        isFirstLoadRef.current = true;
        setError(null);
        setLoading(true);
        startListening();
      } else {
        console.log(`🚫 User not authenticated, stopping listener`);
        stopListening();
        setNotifications([]);
        setLoading(false);
        setError(null);
        setPreferences({
          mealReminders: {
            enabled: true,
            breakfast: {
              enabled: true,
              time: { hour: 8, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            lunch: {
              enabled: true,
              time: { hour: 12, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            dinner: {
              enabled: true,
              time: { hour: 18, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
          },
          weeklyProgress: {
            enabled: true,
            time: { hour: 9, minute: 0 }, // Updated to object
            day: "sunday",
          },
          goalAchievements: {
            enabled: true,
            time: { hour: 21, minute: 0 }, // Updated to object
            days: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
        });
        isFirstLoadRef.current = true;
      }
    });

    return () => {
      unsubscribeAuth();
      stopListening();
    };
  }, [startListening, stopListening]);

  // Add retry logic for failed operations
  const markAsRead = useCallback(async (id: string, retries = 3) => {
    // Immediate UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    // Background sync with retry
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, "users", user.uid, "notifications", id), {
            read: true,
          });
          console.log(`✅ Marked notification ${id} as read`);
          return; // Success, exit retry loop
        }
      } catch (error) {
        console.error(`❌ Error marking notification as read (attempt ${attempt}):`, error);
        
        if (attempt === retries) {
          // Final attempt failed, revert UI
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: false } : n))
          );
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }, []);

  // Optimistic updates with caching
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      // Immediate optimistic update for smooth UX
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Cache locally for offline access
      try {
        await AsyncStorage.setItem(
          "notification_preferences",
          JSON.stringify(updatedPreferences)
        );
      } catch (error) {
        console.error("Failed to cache preferences:", error);
      }

      // Schedule debounced backend sync
      debouncedUpdatePreferences(newPreferences);
    },
    [preferences, debouncedUpdatePreferences]
  );

  // Cleanup
  useEffect(() => {
    // Clean up processed notification IDs periodically
    const cleanupInterval = setInterval(() => {
      const currentSize = processedNotificationIds.current.size;
      if (currentSize > 100) {
        console.log(
          `🧹 Cleaning up processed notification IDs (${currentSize} -> 0)`
        );
        processedNotificationIds.current.clear();
      }
    }, 300000); // Every 5 minutes

    return () => {
      clearInterval(cleanupInterval);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      console.log(`🔄 Refreshing notifications...`);
      setLoading(true);
      setError(null);
      
      // Properly wait for stopListening to complete
      stopListening();
      
      // Reset state
      isFirstLoadRef.current = true;
      setNotifications([]);
      
      // Start listening immediately
      startListening();
    } catch (error: any) {
      console.error("❌ Error refreshing notifications:", error);
      setError(`Failed to refresh notifications: ${error.message}`);
      setLoading(false);
    }
  }, [startListening, stopListening]);

  const value = {
    notifications,
    hasUnread: notifications.some((n) => !n.read),
    preferences,
    loading,
    error,
    markAsRead,
    updatePreferences,
    startListening,
    stopListening,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
